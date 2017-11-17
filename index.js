// import polyfill
import 'babel-polyfill';

// inject tap event plugin
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

// create store
import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise-middleware';
import { createLogger } from 'redux-logger';
const reducer = combineReducers({ sketcher: sketcherReducer });
const enhancer = compose(applyMiddleware(thunkMiddleware, promiseMiddleware(), createLogger({ collapsed: true })));
const store = createStore(reducer, enhancer);

// prepare html (SHOULDN'T BE DONE LIKE THIS)
document.body.style.margin = 0;
document.body.style.padding = 0;
document.body.style.height = '100%';
document.documentElement.style.height = '100%';
document.documentElement.style.overflow = 'hidden';
document.getElementById('app').style.height = '100%';

import * as actions from './src/actions/index.js';
import JSONToSketchData from './src/shape/JSONToSketchData.js';

window.addEventListener('drop', async (event) => {
  console.log(event);
  event.preventDefault();

  for (const file of event.dataTransfer.files) {
      const [name, ...extentions] = file.name.split('.');

      switch (extentions.pop().toUpperCase()) {
        case 'D3SKETCH':
        case 'JSON':
          const url = URL.createObjectURL(file);
          const data = await fetch(url).then(result => result.json());
          const sketchData = await JSONToSketchData(data);
          store.dispatch(actions.openSketch({data:sketchData}));
          break;
        case 'JPG':
        case 'JPEG':
        case 'PNG':
        case 'GIF':
          await store.dispatch(actions.addImage(file));
          break;
        default:
          break;
      }
  }
});

window.addEventListener('dragover', (event) => {
  event.preventDefault();
});


// render dom
import React from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import App from './src/components/App.js';
import sketcherReducer from './src/reducer/index.js';

render((
  <Provider store={store}>
    <App />
  </Provider>
), document.getElementById('app'));

import actionWrapper from 'redux-action-wrapper';
import * as actions from './src/actions/index.js';
window.actions = actionWrapper(actions, store.dispatch);
