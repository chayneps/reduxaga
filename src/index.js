import produce from "immer";
import { takeEvery as reduxTakeEvery } from 'redux-saga/effects';
import { createSelector } from 'reselect';

export const createActions = ({nameSpace,actions,initState,reduceFn})=>{

  console.log("Create action generator: "+ nameSpace);

  const actGens = Object.keys(actions)
      .map((k)=>Object.assign(actions[k],{subType:k}))
      .reduce(
        (acc,{subType,paramsFn,reduceFn,sagaFn})=>
          Object.assign(acc,
            { [subType]: (()=>{

              const gen = (params) => {

                const action = {
                  type: gen.type,
                  subType: gen.subType
                };

                //console.log(`this=${this.type}`);
                return (paramsFn)? paramsFn({action, params}):
                  (typeof params === 'object')? Object.assign(action,params):
                    action;
              };

              gen.nameSpace= nameSpace;
              gen.type = nameSpace+':'+subType;
              gen.reduceFn = convertReduceFn(subType,reduceFn);
              gen.sagaFn = sagaFn;
              return gen;
            })()
          }
        ),
      {});

  actGens.reduceFns = Object.values(actGens)
    .reduce(
      (acc,gen)=>((gen && typeof gen.reduceFn==='function')?
        Object.assign(acc,{ [gen.type] :
          gen.reduceFn }):acc),
      {}
    );

  actGens.sagaFns = Object.values(actGens)
    .reduce(
      (acc,gen)=>((gen && typeof gen.sagaFn==='function')?
        Object.assign(acc,{ [gen.type] :
          gen.sagaFn }):acc),
      {}
    );

  actGens.nameSpace = nameSpace;
  actGens.initState = initState;
  actGens.reselector = createSelector(  (state)=>state[nameSpace.toLowerCase()],
                                        state=>state);
  actGens.selector = (...selectors)=>{

    if(selectors.length<=0)
      return actGens.reselector;
    else if(selectors.length===1)
      switch(typeof selectors[0]) {
        case 'function':
          return createSelector(actGens.reselector,selectors[0]);

        case 'string':
          return createSelector(actGens.reselector,state=>state[selectors[0]]);
        default:
          throw "Error!";
      }
    else
      return createSelector(
        actGens.reselector,
        eval("state=>"+selectors.reduce((acc,i)=>i && typeof i === 'string' && (acc+'["'+i+'"]') || acc,
        'state')));

  };
  actGens.reducer = produce((state, action) => {

    //console.log(`action=${action.type} immutable=${isImmutable(action)}`)


    if ((action.type === undefined)
      || !action.type.startsWith(actGens.nameSpace + ":"))
      return state;

    //console.log(`Calling reduceFn ${action['type']}`);
    const selectedReduceFn = typeof action.reduceFn === 'function' ?
      action.reduceFn : (typeof reduceFn === 'function'? reduceFn: actGens.reduceFns[action.type]);

    return (selectedReduceFn)? selectedReduceFn({state, action, initState}) || state: state ;

  }, actGens.initState);

  return actGens;

};

const convertReduceFn = (key,rawFn) => {

  switch(typeof rawFn){
    case 'function' :
      return rawFn;

    case 'string':
      if(rawFn.startsWith('set')) {

        const valueKey = rawFn.split(' ')[1] || key.slice(3,4).toLowerCase()+key.slice(4);
        //console.log(`valueKey=${valueKey}`);

        return ({state,action})=>{state[valueKey]=action[valueKey]}; // Immer way

      }
      return undefined;

    default:
      return undefined;
  }

};

export const newObject = produce((draft,...src)=>Object.assign(draft,...src));

export const log = (effect, message) => {
  console.log(message);
  return effect
};

export const doTakeEvery = (sagaFns)=>{
  return Object.keys(sagaFns).map((key)=>reduxTakeEvery(key,sagaFns[key]))
};
