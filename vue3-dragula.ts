//--------------------------------------------------//
// vue3-dragula wrapper                             //
// Created by basicx-StrgV                          //
// https://github.com/basicx-StrgV/                 //
//--------------------------------------------------//
// Based on 'vue-dragula' by Astray-git             //
// https://github.com/Astray-git                    //
//--------------------------------------------------//

import dragula from 'dragula';
import mitt from 'mitt';
import type { Emitter } from 'mitt';
import type { App, Directive, DirectiveBinding, VNode } from 'vue';

if (!dragula) {
    throw new Error('[vue3-dragula] cannot locate dragula.');
}

export default function(vueApp: App) {
    const service = new DragulaService();

    let name: string = 'globalBag';
    let drake: any;

    vueApp.directive('dragula', ({
        beforeMount(container: any, binding: DirectiveBinding, vnode: VNode) {
          const bagName = vnode.props ? vnode.props['bag'] : null;

          if (!vnode) {
            throw new Error('[vue3-dragula] vnode does not exist. (beforeMount)');
          }

          if (bagName !== undefined && bagName.length !== 0) {
            name = bagName;
          }

          const bag = service.find(name);
          if (bag) {
            drake = bag.drake;
            drake.containers.push(container);
            return;
          }

          drake = dragula({
            containers: [container]
          })
          service.add(name, drake);
    
          service.handleModels(name, drake);
        },
    
        updated(container: any, binding: DirectiveBinding, vnode: VNode, oldVnode: VNode) {
          const newValue = vnode ? binding.value  : null;

          if (!newValue) { return; }

          const bagName: string | null = vnode.props ? vnode.props['bag'] : null;
          if (bagName != null && bagName.length !== 0) {
            name = bagName;
          }

          const bag = service.find(name);
          drake = bag.drake;
          if (!drake.models) {
            drake.models = [];
          }
    
          if (!vnode) {
            throw new Error('[vue3-dragula] vnode does not exist. (updated)');
          }
          let modelContainer = service.findModelContainerByContainer(container, drake);
    
          if (modelContainer) {
            modelContainer.model = newValue;
          } else {
            drake.models.push({
              model: newValue,
              container: container
            });
          }
        },
    
        unmounted(container: any, binding: DirectiveBinding, vnode: VNode) {
          let unbindBagName = 'globalBag';
          const bagName: string | null = vnode .props ? vnode.props['bag'] : null;

          if (!vnode) {
            throw new Error('[vue3-dragula] vnode does not exist. (unmounted)');
          }

          if (bagName != null && bagName.length !== 0) {
            unbindBagName = bagName;
          }

          let drake = service.find(unbindBagName).drake
          if (!drake) { return; }

          let containerIndex = drake.containers.indexOf(container);
          if (containerIndex > -1) {
            drake.containers.splice(containerIndex, 1);
          }

          if (drake.containers.length === 0) {
            service.destroy(unbindBagName);
          }
        }
      } as Directive));
}

const raf = window.requestAnimationFrame;
const waitForTransition = raf ? function (fn: any) {
    raf(() => {
      raf(fn);
    });
  } : function (fn: any) {
    window.setTimeout(fn, 50);
  };

class DragulaService {
    bags: any;
    eventBus: Emitter<any>;
    events: any;

  constructor () {
    this.bags = []; // bag store
    this.eventBus = mitt();
    this.events = [
      'cancel',
      'cloned',
      'drag',
      'dragend',
      'drop',
      'out',
      'over',
      'remove',
      'shadow',
      'dropModel',
      'removeModel'
    ];
  }

  add (name: any, drake: any) {
    let bag = this.find(name);
    if (bag) {
      throw new Error('Bag named: "' + name + '" already exists.')
    }
    bag = {
      name,
      drake
    }
    this.bags.push(bag);
    if (drake.models) {
      this.handleModels(name, drake);
    }
    if (!bag.initEvents) {
      this.setupEvents(bag);
    }
    return bag;
  }

  find (name: any) {
    let bags = this.bags;
    for (const bag of bags) {
      if (bag.name === name) {
        return bag;
      }
    }
  }

  handleModels (name: any, drake: any) {
    if (drake.registered) { // do not register events twice
      return;
    }
    let dragElm: any;
    let dragIndex: any;
    let dropIndex: any;
    let sourceModel: any;
    drake.on('remove', (el: any, container: any, source: any) => {
      if (!drake.models) {
        return;
      }
      sourceModel = this.findModelForContainer(source, drake);
      sourceModel.splice(dragIndex, 1);
      drake.cancel(true);
      this.eventBus.emit('removeModel', [name, el, source, dragIndex]);
    })
    drake.on('drag', (el: any, source: any) => {
      dragElm = el;
      dragIndex = this.domIndexOf(el, source);
    })
    drake.on('drop', (dropElm: any, target: any, source: any) => {
      if (!drake.models || !target) {
        return;
      }
      dropIndex = this.domIndexOf(dropElm, target);
      sourceModel = this.findModelForContainer(source, drake);

      if (target === source) {
        sourceModel.splice(dropIndex, 0, sourceModel.splice(dragIndex, 1)[0]);
      } else {
        let notCopy = dragElm === dropElm;
        let targetModel = this.findModelForContainer(target, drake);
        let dropElmModel = notCopy ? sourceModel[dragIndex] : JSON.parse(JSON.stringify(sourceModel[dragIndex]));

        if (notCopy) {
          waitForTransition(() => {
            sourceModel.splice(dragIndex, 1);
          })
        }
        targetModel.splice(dropIndex, 0, dropElmModel);
        drake.cancel(true);
      }
      this.eventBus.emit('dropModel', [name, dropElm, target, source, dropIndex]);
    })
    drake.registered = true;
  }

  destroy (name: any) {
    let bag = this.find(name);

    if (!bag) { return; }

    let bagIndex = this.bags.indexOf(bag);
    this.bags.splice(bagIndex, 1);
    bag.drake.destroy();
  }

  setOptions (name: any, options: any) {
    let bag = this.add(name, dragula(options));
    this.handleModels(name, bag.drake);
  }

  setupEvents (bag: any) {
    bag.initEvents = true;
    let _this = this;

    let emitter = (type: any) => {
      function replicate () {
        let args = Array.prototype.slice.call(arguments);
        _this.eventBus.emit(type, [bag.name].concat(args));
      }

      bag.drake.on(type, replicate);
    }

    this.events.forEach(emitter);
  }

  domIndexOf (child: any, parent: any) {
    return Array.prototype.indexOf.call(parent.children, child);
  }

  findModelForContainer (container: any, drake: any) {
    return this.findModelContainerByContainer(container, drake)?.model;
  }

  findModelContainerByContainer (container: any, drake: any) {
    if (!drake.models) {
      return;
    }

    return drake.models.find((model: any) => model.container === container);
  }
}
