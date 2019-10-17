# reduxaga (Read re-do-sa-ga)
Boilerplate for React with Redux Saga Immer Reselect.

Code action generators, reducers, sagas in the same file. The reducers are Immerization and the selectors are Reselectization.

#### actions/path.js
```javascript
import {createActions} from 'reduxaga';

const pathActions =  createActions({

  nameSpace: "PATH",

  actions: {

    doLogin: {
      sagaFn: function* doLogin(action){

        console.log("Saga PATH:Login by "+action.name);

      },

      reduceFn: ({state,action,initState}) => {
        state.doingLogin= true; // Immer way to set state
      }
    },

    // If reduceFn is string, it try to parse and create reduceFunction for you.

    doneLogin: {

      reduceFn: "set doingLogin" // set doingLogin get the value from action.doingLogin

    },

    setDoingLogin: {

      reduceFn: "set" // set doingLogin (derived from action name) from action.doingLogin

    },

    setAll: {

      reduceFn: "setAll" // set action's other props apart from "type" and "subType"

    },

    init: {

      reduceFn: ({initState}=>initState)

    }

  },

  initState: {
    doingLogin: false,
    loginCred:{
      accessToken: undefined,
      expired: undefined
    }
  }

});

export default pathActions;
```

#### Action Generators
```javascript
import pathActions from '../actions/path';

dispatch(pathActions.init()); 
dispatch(pathActions.doLogin({name:"Peter"}));
dispatch(pathActions.doneLogin({doingLogin: false});
dispatch(pathActions.setAll({doingLogin:true, anyOtherProp: "AnyThing"});

dispatch(pathActions.setAll({reduceFn:({state,action})=>{state.doingLogin:undefined}})); // reduceFn can be sent with actions

```

#### Selectors
```javascript
import {useSelector} from 'react-redux'

let doingLogin = useSelector(pathActions.selector((state)=state.doingLogin)); // Only select state on the 'path' branch
let doingLogin2 = useSelector(pathActions.selector("doingLogin"); // Select path.doingLogin 
let doingLogin3 = useSelector(pathActions.selector("loginCred","accessToken")); Select path.doingLogin.accessToken

```


#### Root Reducer
```javascript
import pathActions from '../actions/path';
import appActions from '../actions/app';

export const roodReducer = {
  path: pathActions.reducer,
  app: appActions.reducer
}
```

#### Root saga
```javascript
import appActions from '../actions/app';
import pathActions from '../actions/path';

export default function* rootSaga() {
  yield all([
    ...pathActions.takeEvery(),
    ...appActions.takeEvery(),
  ]);
}
```
