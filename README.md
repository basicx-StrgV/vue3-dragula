# vue3-dragula (WIP)
> 👌 Drag and drop so simple it hurts

Vue3 wrapper library for [`dragula`](https://github.com/bevacqua/dragula)

Based on [`vue-dragula`](https://github.com/Astray-git/vue-dragula) from [@Astray-git](https://github.com/Astray-git)

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
<div class="wrapper">
  <div class="container" v-dragula="itemListOne" bag="bag-one">
    <MyItemComponent v-for="item in itemListOne" :key="item.id"></MyItemComponent>
  </div>
  <div class="container" v-dragula="itemListTwo" bag="bag-one">
    <MyItemComponent v-for="item in itemListTwo" :key="item.id"></MyItemComponent>
  </div>
</div>
```

### Attribute explanation
- `v-dragula`:
  - __The `v-dragula ` attribute will make the element it is attached to into a container used by dragula.__  
__The value given to the attribute is an array of all the items in the container.__  
_The array of items needs to be the same as the one that is used to load the item elements with `v-for`.
The `key` attribute should be used together with `v-for` to ensure that vue will render the list correctly._  
_To learn more on how to use `v-for` and `key`, please read the official [vue3 documentation](https://vuejs.org/guide/essentials/list.html) about `v-for`._ 

- `bag`:
  - __The `bag` attribute takes a string as its value, that represents the name of the bag.__  
__A bag is a collection of multiple containers allocated to the same dragula instance.__  
__All containers that should be dragged and dropped in between, need to be in the same bag.__  
_(As seen in the usage sample. )_



