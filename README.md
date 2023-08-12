# vue3-dragula (WIP)
> 👌 Drag and drop so simple it hurts

Vue3 wrapper library for [`dragula`](https://github.com/bevacqua/dragula).  
<sup>Written in typescript.</sup>

Based on [`vue-dragula`](https://github.com/Astray-git/vue-dragula) from [@Astray-git](https://github.com/Astray-git).

---
[![CodeQL](https://github.com/basicx-StrgV/vue3-dragula/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/basicx-StrgV/vue3-dragula/actions/workflows/github-code-scanning/codeql)


## Install

The library is available on [npm](https://www.npmjs.com/) as  [`vue3-dragula`](https://www.npmjs.com/package/vue3-dragula).
``` bash
npm install --save vue3-dragula
```
## Setup
First import the ‘VueDagula’ plugin from ‘vue3-dragula’ and then add it to your vue3 app.
``` ts
import { createApp } from 'vue';
import App from './App.vue';

// Import of the VueDragula plugin
import { VueDragula } from 'vue3-dragula';

const vueApp = createApp(App);

// Adding the plugin to the vue app
vueApp.use(VueDragula);

vueApp.mount('#app')
```

## Usage
The functionality of the plugin can be used in your vue components. 
The template of two lists with items that can be dragged and dropped could look like the following example.

``` vue
<div class="container-wrapper">
  <div class="container" v-dragula="itemListOne" bag="bag-one">
    <div v-for="item in itemListOne" :key="item.id">{{ item.text }}</div>
  </div>
  <div class="container" v-dragula="itemListTwo" bag="bag-one">
    <div v-for="item in itemListTwo" :key="item.id">{{ item.text }}</div>
  </div>
</div>
```

### Attribute explanation
#### `v-dragula`
The `v-dragula ` attribute will make the element it is attached to into a container used by dragula.  
The value given to the attribute is an array of all the items in the container.

The array of items needs to be the same as the one that is used to load the item elements with `v-for`.  
The `key` attribute should be used together with `v-for` to ensure that vue will render the list correctly.

_To learn more on how to use `v-for` and `key`, please read the official [vue3 documentation](https://vuejs.org/guide/essentials/list.html) about `v-for`._ 

#### `bag`
The `bag` attribute takes a string as its value, that represents the name of the bag.  
A bag is a collection of multiple containers allocated to the same dragula instance.  
All containers that should be dragged and dropped in between, need to be in the same bag.  
_(As seen in the usage sample. )_

## APIs
The APIs can be accessed through the `VueDragulaGlobal` object, which can be important from `vue3-dragula`.
``` js
import { VueDragulaGlobal } from 'vue3-dragula';
```

### `options(name, options)`
The options function provides the functionality of configuring a dragula instance.  
The `name` parameter should be a ___string___ containing the name of the bag, and the `options` parameter should be a ___dragula options object___.

_More infos about dragula options can be found in the [dragula documentation](https://github.com/bevacqua/dragula/blob/master/readme.markdown#optionscontainers)._

``` js
VueDragulaGlobal.options('bag-one', {
  moves: function (el, source, handle, sibling) {
    return checkElementMove(el, source, handle);
  },
  direction: 'vertical',
  copy: false
});
```
### `find(name)`

The find function returns a `Bag` object, depending on the provided bag name.  
If the bag with the provided name does not exist, the method will return `null`.

The returned `Bag` object contains the name of the bag and the `drake` of the dragula instance.

_More infos about the `drake` object can be found in the [dragula documentation](https://github.com/bevacqua/dragula/blob/master/readme.markdown#api)._


``` js
const bagOne = VueDragulaGlobal.find('bag-one');
```

## Events
The events can be accessed through the `VueDragulaGlobal` objects event bus, which can be important from `vue3-dragula`.

``` js
import { VueDragulaGlobal } from 'vue3-dragula';
```

The dragula instance events can be accessed from the event bus.

_More infos about the dragula events can be found in the [dragula documentation](https://github.com/bevacqua/dragula/blob/master/readme.markdown#drakeon-events)._

``` js
VueDragulaGlobal.eventBus.on('drop', (args) => {
  console.log('drop');
  console.log(args);
});
```

### vue3-dragula Events
| Event Name |      Listener Arguments      |  Event Description |
| :-------------: |:-------------:| -----|
| dropModel | bagName, el, target, source, dropIndex | Model was synced, dropIndex exposed |
| removeModel | bagName, el, container, removeIndex | Model was synced, removeIndex exposed |
