### 修改时几个命令
 - `cp -rf projects/react-dag projects/tos-client/node_modules`
 - `npm run prod-build`
 - `npm run dev-build`

### react-dag

This is a base implementation of wrapping jsplumb with react + redux to be more usable in a react based environment.

#### Install

`npm install git://github.com/liuwei0514/react-dag.git#master --save`

  (As of now I have not yet published it to npm YET! Will do soon.)

#### Usage
  ```
    import {DAG} from 'react-dag';
    class MyComponent extends Component {
      ...
      render() {
        return (
          <DAG settings={this.settings}
              data={this.data}
              enhancers={this.enhancers}
              additionalReducersMap={this.additionalReducersMap}
              middlewares={this.middlewares}/>
        );
      }
    }
  ```

#### Props
  - `settings` - Settings to be used for JsPlumb. Check out `dag-settings.js` for base settings that are available.
  ###### Note
    The `settings` prop is like either or - Either you provide the entire settings for the DAG or take the base settings. I am still yet to work on how to achieve granularity (or mixin) multiple different settings.

  - `data` - Is the initial state of the DAG. Could be used to render the DAG right away if the data is already available (instead of constructing the DAG one node at a time).

  - `enhancers` - Are the list of enhancers you would want to add to the `dag-store`. To read more about enhancers please check the [documentation here](https://github.com/reactjs/redux/blob/master/docs/Glossary.md#store-enhancer)

  - `additionalReducersMap` - The DAG comes with a base reducer that does some base operations. If you want additional reducers to be used for any property of the store you could pass in the map and the reducers would get `reduce`'d (as in executed one at a time. Something like reduce reducer)

    For instance the store right now has a structure like,
      ```
      {
        nodes: nodesReducer,
        connections: connectionsReducer,
        graph: graphReducer
      }
      ```
      In addition to the the `nodesReducer` if there are additional reducers that you want to add then it could be passed in as something like this,

      ```
      {
        nodes: [myReducer1, sometherReducer2]
      }
      ```

      Based on the additional reducer the above implementation of redux store's reducer becomes,

      ```
      {
        nodes: nodesReducers
                .reduce((prev, curr) => curr.bind(null, prev(state, action), action))(),
        connections: connectionsReducer
                .reduce((prev, curr) => curr.bind(null, prev(state, action), action))(),
        graph: graphReducer
                .reduce((prev, curr) => curr.bind(null, prev(state, action), action))(),
      }
      ```
    ##### Note
      This is a little crude as of now. Will have to see if I can use this as a generic functionality for any store.

  - `middlewares` - Similar to `additionalReducers` you could pass in additional middlewares that you want to add based on your reducers.
