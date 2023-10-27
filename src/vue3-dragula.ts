//--------------------------------------------------//
// vue3-dragula                                     //
// Created by basicx-StrgV                          //
// https://github.com/basicx-StrgV/                 //
//--------------------------------------------------//
// Based on 'vue-dragula' by Astray-git             //
// https://github.com/Astray-git                    //
//--------------------------------------------------//

import type { Drake, DragulaOptions } from "dragula";
import type { App, Directive, DirectiveBinding, VNode, Plugin } from "vue";
import type { Emitter } from "mitt";
import { nextTick } from "vue";
import dragula from "dragula";
import mitt from "mitt";

if (!dragula) {
  throw new Error("[vue3-dragula] Cannot locate package: dragula");
}

if (!mitt) {
  throw new Error("[vue3-dragula] Cannot locate package: mitt");
}

export const VueDragula: Plugin = {
  install(app: any, options: any) {
    vueDragula(app);
  },
};

export class Bag {
  name: string;
  drake: Drake | null;
  drakeRegistert: boolean = false;
  initEvents: boolean = false;
  models: any[] = [];

  constructor(name: string, drake: any) {
    this.name = name;
    this.drake = drake;
  }

  destroy() {
    this.drakeRegistert = false;
    this.initEvents = false;
    this.models.splice(0, this.models.length);
    if (this.drake != null) {
      this.drake.destroy();
    }
    this.drake = null;
  }
}

export class VueDragulaGlobal {
  static eventBus: Emitter<any>;
  static options: Function;
  static injectOptions: Function;
  static find: Function;
}

function vueDragula(vueApp: App) {
  const service: DragulaService = new DragulaService();

  VueDragulaGlobal.eventBus = service.eventBus;
  VueDragulaGlobal.find = service.find.bind(service);
  VueDragulaGlobal.options = service.setOptions.bind(service);
  VueDragulaGlobal.injectOptions = service.injectOptions.bind(service);

  vueApp.directive("dragula", {
    beforeMount(container: Element, binding: DirectiveBinding, vnode: VNode) {
      let name: string = "globalBag";
      let drake: Drake | null;

      const bagName: string | null = vnode.props ? vnode.props["bag"] : null;

      if (bagName != null && bagName.trim().length !== 0) {
        name = bagName;
      }

      let bag: Bag | null = service.find(name);
      if (bag != null) {
        drake = bag.drake;

        if (drake == null) {
          return;
        }

        drake.containers.push(container);

        updateModelBinding(container, binding, vnode);

        return;
      }

      drake = dragula({ containers: [container] } as DragulaOptions);

      bag = service.add(name, drake);
      updateModelBinding(container, binding, vnode);

      service.handleModels(name, bag);
    },

    updated(
      container: Element,
      binding: DirectiveBinding,
      vnode: VNode,
      oldVnode: VNode
    ) {
      updateModelBinding(container, binding, vnode);
    },

    unmounted(container: Element, binding: DirectiveBinding, vnode: VNode) {
      let unbindBagName: string = "globalBag";

      const bagName: string | null = vnode.props ? vnode.props["bag"] : null;

      if (bagName != null && bagName.trim().length !== 0) {
        unbindBagName = bagName;
      }

      let bag: Bag | null = service.find(unbindBagName);
      if (bag == null || bag.drake == null) {
        return;
      }

      let containerIndex = bag.drake.containers.indexOf(container);
      if (containerIndex > -1) {
        bag.drake.containers.splice(containerIndex, 1);
      }

      if (bag.drake.containers.length === 0) {
        service.destroy(unbindBagName);
      }
    },
  } as Directive);

  function updateModelBinding(
    container: Element,
    binding: DirectiveBinding,
    vnode: VNode
  ) {
    let name: string = "globalBag";

    const newValue: any[] | null = vnode ? (binding.value as any[]) : null;

    if (newValue == null) {
      return;
    }

    const bagName: string | null = vnode.props ? vnode.props["bag"] : null;
    if (bagName != null && bagName.trim().length !== 0) {
      name = bagName;
    }

    const bag = service.find(name);
    if (bag == null) {
      return;
    }

    let modelContainer = service.findModelContainerByContainer(container, bag);

    if (modelContainer) {
      modelContainer.model = newValue;
    } else {
      bag.models.push({
        model: newValue,
        container: container,
      });
    }
  }
}

class DragulaService {
  // Bag storage
  bags: Bag[];
  // Event bus for global access
  eventBus: Emitter<any>;
  events: string[];

  constructor() {
    this.bags = [];
    this.eventBus = mitt();
    this.events = [
      "cancel",
      "cloned",
      "drag",
      "dragend",
      "drop",
      "out",
      "over",
      "remove",
      "shadow",
      "dropModel",
      "removeModel",
    ];
  }

  add(name: string, drake: Drake): Bag {
    let bag: Bag | null = this.find(name);

    if (bag != null) {
      throw new Error(
        '[vue3-dragula] Bag named: "' + name + '" already exists.'
      );
    }

    bag = new Bag(name, drake);
    this.bags.push(bag);

    this.handleModels(name, bag);

    if (!bag.initEvents) {
      this.setupEvents(bag);
    }

    return bag;
  }

  find(name: string): Bag | null {
    let bags: Bag[] = this.bags;
    for (const bag of bags) {
      if (bag.name === name) {
        return bag;
      }
    }
    return null;
  }

  handleModels(name: string, bag: Bag): void {
    // Cancel if drake object does not exist or if it is already registert
    if (bag.drake == null || bag.drakeRegistert) {
      return;
    }

    let dragElm: Element;
    let dragIndex: number;
    let isManualCancel: boolean = false;

    // On Remove event handler
    bag.drake.on(
      "remove",
      (el: Element, container: Element, source: Element) => {
        if (bag.drake == null) {
          return;
        }

        let sourceModel: any[] = this.findModelForContainer(source, bag);
        sourceModel.splice(dragIndex, 1);

        isManualCancel = true;
        bag.drake.cancel(true);

        // Emit removeModel event
        this.eventBus.emit("removeModel", [name, el, source, dragIndex]);
      }
    );

    // On Drag event handler
    bag.drake.on("drag", (el: Element, source: Element) => {
      dragElm = el;
      dragIndex = this.domIndexOf(el, source);
    });

    // On Drop event handler
    bag.drake.on(
      "drop",
      (dropElm: Element, target: Element, source: Element) => {
        if (bag.drake == null || target == null) {
          return;
        }

        let dropIndex: number = this.domIndexOf(dropElm, target);
        let sourceModel: any[] = this.findModelForContainer(source, bag);

        let dropElmModel: any = null;

        if (target === source) {
          nextTick(() => {
            sourceModel.splice(
              dropIndex,
              0,
              sourceModel.splice(dragIndex, 1)[0]
            );
          });

          dropElmModel = sourceModel[dropIndex];
        } else {
          let notCopy = dragElm === dropElm;
          let targetModel = this.findModelForContainer(target, bag);
          dropElmModel = notCopy
            ? sourceModel[dragIndex]
            : this.cloneObject(sourceModel[dragIndex]);

          if (notCopy) {
            nextTick(() => {
              sourceModel.splice(dragIndex, 1);
            });
          }

          nextTick(() => {
            targetModel.splice(dropIndex, 0, dropElmModel);
          });
        }

        isManualCancel = true;
        bag.drake.cancel(true);

        // Emit dropModel event
        this.eventBus.emit("dropModel", [
          name,
          dropElm,
          dropElmModel,
          target,
          source,
          dropIndex,
        ]);
      }
    );

    // On Cancel event handler
    bag.drake.on(
      "cancel",
      (dropElm: Element, container: Element, source: Element) => {
        // Only handle the cancel if it was triggerd by dragula and not from this library
        if (bag.drake == null || isManualCancel) {
          isManualCancel = false;
          return;
        }

        let sourceModel: any[] = this.findModelForContainer(source, bag);

        let dropElmModel: any = sourceModel[dragIndex];

        // Emit cancelModel event
        this.eventBus.emit("cancelModel", [
          name,
          dropElm,
          dropElmModel,
          source,
        ]);
      }
    );

    // Set registration flag
    bag.drakeRegistert = true;
  }

  destroy(name: string): void {
    let bag: Bag | null = this.find(name);

    if (bag == null) {
      return;
    }

    let bagIndex: number = this.bags.indexOf(bag);
    this.bags.splice(bagIndex, 1);

    bag.destroy();
  }

  setOptions(name: string, options: DragulaOptions): void {
    let bag: Bag = this.add(name, dragula(options));
    if (bag.drake != null) {
      this.handleModels(name, bag);
    }
  }

  injectOptions(name: string, options: DragulaOptions): void {
    let bag: Bag = this.find(name);

    if (bag == null) {
      throw new Error(
        '[vue3-dragula] Bag named: "' + name + '" does not exists.'
      );
    }

    let currentContainers: Element[] = [];
    if (bag.drake != null) {
      currentContainers = bag.drake.containers;
      bag.drake.destroy();
      bag.drake = null;
      bag.drakeRegistert = false;
      bag.initEvents = false;
    }

    options.containers = currentContainers;

    bag.drake = dragula(options);

    this.handleModels(name, bag);
    this.setupEvents(bag);
  }

  setupEvents(bag: Bag): void {
    bag.initEvents = true;
    let _this: this = this;

    let emitter = (type: any) => {
      function replicate() {
        let args: any[] = Array.prototype.slice.call(arguments);
        _this.eventBus.emit(type, [bag.name].concat(args));
      }

      if (bag.drake != null) {
        bag.drake.on(type, replicate);
      }
    };

    this.events.forEach(emitter);
  }

  domIndexOf(child: Element, parent: Element): number {
    return Array.prototype.indexOf.call(parent.children, child);
  }

  findModelForContainer(container: Element, bag: Bag): any {
    return this.findModelContainerByContainer(container, bag)?.model;
  }

  findModelContainerByContainer(container: Element, bag: Bag): any {
    return bag.models.find((model: any) => model.container === container);
  }

  cloneObject(object: any): any {
    return JSON.parse(JSON.stringify(object));
  }
}
