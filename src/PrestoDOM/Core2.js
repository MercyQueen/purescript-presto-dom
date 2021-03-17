const prestoUI = require("presto-ui")
const prestoDayum = prestoUI.doms;
const callbackMapper = prestoUI.callbackMapper;
var webParseParams, iOSParseParams, parseParams;

if (window.__OS === "WEB") {
  webParseParams = prestoUI.helpers.web.parseParams;
} else if (window.__OS == "IOS") {
  iOSParseParams = prestoUI.helpers.ios.parseParams;
} else {
  parseParams = prestoUI.helpers.android.parseParams;
}


const state = {
  scopedState : {}
}

function createPrestoElement() {
  if (
    typeof window.__ui_id_sequence != "undefined" &&
    window.__ui_id_sequence != null
  ) {
    return {
      __id: ++window.__ui_id_sequence
    };
  } else {
    window.__ui_id_sequence =
      typeof Android.getNewID == "function"
        ? parseInt(Android.getNewID()) * 1000000
        : window.__PRESTO_ID || getPrestoID() * 1000000;
    return {
      __id: ++window.__ui_id_sequence
    };
  }
};

function removeViewFromNameSpace (namespace, id) {
  // Return a callback, which can be used to remove the screen
  return function() {
    Android.removeView(id, state.scopedState[namespace].id ? state.scopedState[namespace].id : null)
  }
}


function hideViewInNameSpace (id) {
  // Return callback to hide screens
  return function () {
    var __visibility = window.__OS == "ANDROID" ? "gone" : "invisible";
    var prop = {
      id: id,
      visibility: __visibility
    };
    if (window.__OS == "ANDROID" && length > 1) {
      var cmd = cmdForAndroid(prop, true, "relativeLayout");
      Android.runInUI(cmd.runInUI, null);
    } else if (window.__OS == "IOS" && length > 1) {
      Android.runInUI(prop);
    } else if (length > 1) {
      Android.runInUI(webParseParams("relativeLayout", prop, "set"));
    }
  }
}

function showViewInNameSpace (id) {
  // Return callback to show screens
  return function () {
    var prop = {
      id: id,
      visibility: "visible"
    };
    if (window.__OS == "ANDROID" && length > 1) {
      var cmd = cmdForAndroid(prop, true, "relativeLayout");
      Android.runInUI(cmd.runInUI, null);
    } else if (window.__OS == "IOS" && length > 1) {
      Android.runInUI(prop);
    } else if (length > 1) {
      Android.runInUI(webParseParams("relativeLayout", prop, "set"));
    }
  }
}

function domAll(elem, screenName, namespace){
  return domAllImpl(elem, screenName, {}, namespace);
}

/**
 * Creates DUI element from machine element
 * Note: Only for Android
 * @param {object} elem - machine
 * @param {object} screenName
 * @param {object} VALIDATE_ID - for validating duplicate IDs, always pass empty object
 * @return {DUIElement}
 *
 * Can be called in pre-rendering, doesn't depend on window.__dui_screen
 */
function domAllImpl(elem, screenName, VALIDATE_ID, namespace) {
  /*
  if (!elem.__ref) {
    elem.__ref = window.createPrestoElement();
  }

  if (elem.props.id) {
    elem.__ref.__id = parseInt(elem.props.id, 10) || elem.__ref.__id;
  }
  */

  if (elem.props.hasOwnProperty('id') && elem.props.id != '' && (elem.props.id).toString().trim() != '') {
    var id = (elem.props.id).toString().trim();
    elem.__ref = {__id: id };
    if (VALIDATE_ID.hasOwnProperty(id)){
      console.warn("Found duplicate ID! ID: "+ id +
        " maybe caused because of overiding `id` prop. This may produce unwanted behvior. Please fix..");
    } else {
      VALIDATE_ID[id] = 'used';
    }
  } else if(!elem.__ref) {
    elem.__ref = window.createPrestoElement()
  }

  var type = prestoUI.prestoClone(elem.type);
  var props = prestoUI.prestoClone(elem.props);

  if (window.__OS !== "WEB") {
    if(props.hasOwnProperty("afterRender")){
      window.afterRender = window.afterRender || {}
      window.afterRender[screenName] = window.afterRender[screenName] || {}
      var x = props.afterRender;
      window.afterRender[screenName][elem.__ref.__id] = function(){
        return x;
      }
      delete props.afterRender
    }
    if (
      props.entryAnimation ||
      props.entryAnimationF ||
      props.entryAnimationB
    ) {
      if (props.onAnimationEnd) {
        var callbackFunction = props.onAnimationEnd;
        var updatedCallback = function(event) {
          hideOldScreenNow(namespace);
          callbackFunction(event);
        };
        props.onAnimationEnd = updatedCallback;
      } else {
        props.onAnimationEnd = function() {
            hideOldScreenNow(namespace);
          }
      }
    }
    if (props.entryAnimation) {
      props.inlineAnimation = props.entryAnimation;
      state.scopedState[namespace].animations.entry[screenName].hasAnimation = true
      state.scopedState[namespace].animations.entry[screenName][elem.__ref.__id] = {
          visibility: props.visibility ? props.visibility : "visible",
          inlineAnimation: props.entryAnimation,
          onAnimationEnd: props.onAnimationEnd,
          type: type
        };
    }
    
    if (props.entryAnimationF) {
      state.scopedState[namespace].animations.entryF[screenName].hasAnimation = true
      state.scopedState[namespace].animations.entryF[screenName][elem.__ref.__id] = {
          visibility: props.visibility ? props.visibility : "visible",
          inlineAnimation: props.entryAnimationF,
          onAnimationEnd: props.onAnimationEnd,
          type: type
        };
      props.inlineAnimation = props.entryAnimationF;
    }

    if (props.entryAnimationB) {
      state.scopedState[namespace].animations.entryB[screenName].hasAnimation = true
      state.scopedState[namespace].animations.entryB[screenName][elem.__ref.__id] = {
        visibility: props.visibility ? props.visibility : "visible",
        inlineAnimation: props.entryAnimationB,
        onAnimationEnd: props.onAnimationEnd,
        type: type
      };
    }

    if (props.exitAnimation) {
      state.scopedState[namespace].animations.exit[screenName].hasAnimation = true
      state.scopedState[namespace].animations.exit[screenName][elem.__ref.__id] = {
        inlineAnimation: props.exitAnimation,
        onAnimationEnd: props.onAnimationEnd,
        type: type
      };
    }

    if (props.exitAnimationF) {
      state.scopedState[namespace].animations.exitF[screenName].hasAnimation = true
      state.scopedState[namespace].animations.exitF[screenName][elem.__ref.__id] = {
        inlineAnimation: props.exitAnimationF,
        onAnimationEnd: props.onAnimationEnd,
        type: type
      };
    }

    if (props.exitAnimationB) {
      state.scopedState[namespace].animations.exitB[screenName].hasAnimation = true
      state.scopedState[namespace].animations.exitB[screenName][elem.__ref.__id] = {
        inlineAnimation: props.exitAnimationB,
        onAnimationEnd: props.onAnimationEnd,
        type: type
      };
    }
  }

  if (props.focus == false && window.__OS === "ANDROID") {
    delete props.focus;
  }

  var children = [];

  for (var i = 0; i < elem.children.length; i++) {
    children.push(domAllImpl(elem.children[i], screenName, VALIDATE_ID, namespace));
  }

  if (__OS == "WEB" && props.onResize) {
    window.__resizeEvent = props.onResize;
  }

  props.id = elem.__ref.__id;
  if (elem.parentType && window.__OS == "ANDROID")
    return prestoDayum(
      {
        elemType: type,
        parentType: elem.parentType
      },
      props,
      children
    );

  return prestoDayum(type, props, children);
}

function hideOldScreenNow(namespace) {
  while(state.scopedState[namespace].hideList.length > 0) {
    var screenName = state.scopedState[namespace].hideList.pop();
    var cb = state.scopedState[namespace].screenHideCallbacks[screenName]
    if(typeof cb == "function") {
      cb();
    }
  }
  while(state.scopedState[namespace].removeList.length > 0) {
    var screenName = state.scopedState[namespace].removeList.pop();
    var cb = state.scopedState[namespace].screenRemoveCallbacks[screenName]
    if(typeof cb == "function") {
      cb();
    }
  } 
}

function cmdForAndroid(config, set, type) {
  if (set) {
    if (config.id) {
      var obj = parseParams(type, config, "set");
      var cmd = obj.runInUI
        .replace("this->setId", "set_view=ctx->findViewById")
        .replace(/this->/g, "get_view->");
      cmd = cmd.replace(/PARAM_CTR_HOLDER[^;]*/g, "get_view->getLayoutParams;");
      obj.runInUI = cmd;
      return obj;
    } else {
      console.error(
        "ID null, this is not supposed to happen. Debug this or/and raise a issue in bitbucket."
      );
    }
    return {};
  }

  var id = config.id;
  var cmd = "set_view=ctx->findViewById:i_" + id + ";";
  delete config.id;
  config.root = "true";
  var obj = parseParams(type, config, "get");
  obj.runInUI = cmd + obj.runInUI + ";";
  obj.id = id;
  return obj;
}

exports.callAnimation = callAnimation__

/**
 * Implicit animation logic.
 * 1. If two consecutive screens are runscreen. Call animation on both.
 * 2. If screen is show screen and previous screen is runscreen. Call animation only on showScreen
 * 3. If screen is run screen and previous is show. Call animation on show, run and previous visible run.\
 * animationStack : Array of runscreens where exit animation has not be called
 * animationCache : Array of showscreens.
 */

function callAnimation__ (screenName, namespace, cache) {
  debugger
  if (screenName == state.scopedState[namespace].animations.lastAnimatedScreen)
      return;
  var isRunScreen = state.scopedState[namespace].animations.animationStack.indexOf(screenName) != -1;
  var isShowScreen = state.scopedState[namespace].animations.animationCache.indexOf(screenName) != -1;
  var isLastAnimatedCache = state.scopedState[namespace].animations.animationCache.indexOf(state.scopedState[namespace].animations.lastAnimatedScreen) != -1;
  var topOfStack = state.scopedState[namespace].animations.animationStack[state.scopedState[namespace].animations.animationStack.length - 1];
  var animationArray = []
  if (isLastAnimatedCache){
    animationArray.push({ screenName : state.scopedState[namespace].animations.lastAnimatedScreen + "", tag : "exit"});
  }
  if (isRunScreen || isShowScreen) {
    if(isRunScreen) {
      if(topOfStack != screenName) {
        animationArray.push({ screenName : screenName, tag : "entryB"})
        animationArray.push({ screenName : topOfStack, tag : "exitB"})
        while (state.scopedState[namespace].animations.animationStack[state.scopedState[namespace].animations.animationStack.length - 1] != screenName){
          state.scopedState[namespace].animations.animationStack.pop();
        }
      }
    } else {
      animationArray.push({ screenName : screenName, tag : "entry"})
    }
  } else {
    // Newscreen case
    if (cache){
      state.scopedState[namespace].animations.animationCache.push(screenName); // TODO :: Use different data structure. Array does not realy fit the bill.
    } else {
      // new runscreen case call forward exit animation of previous runscreen
      var previousScreen = state.scopedState[namespace].animations.animationStack[state.scopedState[namespace].animations.animationStack.length - 1]
      animationArray.push({ screenName : previousScreen, tag : "exitF"})
      state.scopedState[namespace].animations.animationStack.push(screenName);
    }
  }
  callAnimation_(namespace, animationArray, false)
  state.scopedState[namespace].animations.lastAnimatedScreen = screenName;
}

function callAnimation_ (namespace, screenArray, resetAnimation) {
  window.enableBackpress = false;
  if (window.__OS == "WEB") {
    hideOldScreenNow(namespace);
    return;
  }
  var hasAnimation = false;
  screenArray.forEach(
    function (animationJson) {
      if (state.scopedState[namespace].animations[animationJson.tag] && state.scopedState[namespace].animations[animationJson.tag][animationJson.screenName]) {
        var animationJson = state.scopedState[namespace].animations[animationJson.tag][animationJson.screenName]
        for (var key in animationJson) {
          if (key == "hasAnimation")
            continue;
          hasAnimation = true;
          var config = {
            id: key,
            inlineAnimation: animationJson[key].inlineAnimation,
            onAnimationEnd: animationJson[key].onAnimationEnd,
            visibility: animationJson[key].visibility
          };
          if (resetAnimation){
            config["resetAnimation"] = true;
          }
          if (window.__OS == "ANDROID") {
            var cmd = cmdForAndroid(
              config,
              true,
              animationJson[key].type
            );
            if (Android.updateProperties) {
              Android.updateProperties(JSON.stringify(cmd), state.scopedState[namespace].id ? state.scopedState[namespace].id : null);
            } else {
              Android.runInUI(cmd.runInUI, null);
            }
          } else if (window.__OS == "IOS") {
            Android.runInUI(config);
          } else {
            Android.runInUI(webParseParams("linearLayout", config, "set"));
          }
        }
      }
    }
  );
  if (!hasAnimation){
    hideOldScreenNow(namespace)
  }
}


function executePostProcess(name, namespace, cache) {
  return function() {
    console.log("Hyper was here" , state)
    callAnimation__(name, namespace, cache);
    // if (window.__dui_screen && window["afterRender"] && window["afterRender"][window.__dui_screen] && !window["afterRender"][window.__dui_screen].executed) {
    //   for (var tag in window["afterRender"][window.__dui_screen]) {
    //     if (tag === "executed")
    //       continue;
    //     try {
    //       window["afterRender"][window.__dui_screen][tag]()();
    //       window["afterRender"][window.__dui_screen]["executed"] = true;
    //     } catch (err) {
    //       console.warn(err);
    //     }
    //   }
    // }
  };
}

exports.checkAndDeleteFromHideAndRemoveStacks = function (namespace, screenName) {
  try {
    var index = state.scopedState[namespace].hideList.indexOf(screenName)
    if(index != -1) {
      delete state.scopedState[namespace].hideList[index];
    }
    var index = state.scopedState[namespace].removeList.indexOf(screenName)
    if(index != -1) {
      delete state.scopedState[namespace].removeList[index];
    }
  } catch(e) {
    // Ignored this will happen ever first time for each screen
  }
}

exports.setUpBaseState = function (namespace) {
  return function (id) {
    return function () {
      state.scopedState[namespace] = state.scopedState[namespace] || {}
      state.scopedState[namespace].id = id
      var elemRef = createPrestoElement();
      state.scopedState[namespace].root = {
          type: "relativeLayout",
          props: {
            id : elemRef.__id,
            root: "true",
            height: "match_parent",
            width: "match_parent"
          },
          __ref : elemRef,
          children: []
        };
      state.scopedState[namespace].MACHINE_MAP = {}
      state.scopedState[namespace].screenStack = []
      state.scopedState[namespace].hideList = []
      state.scopedState[namespace].removeList = []
      state.scopedState[namespace].screenCache = {}
      state.scopedState[namespace].screenHideCallbacks = {}
      state.scopedState[namespace].screenShowCallbacks = {}
      state.scopedState[namespace].screenRemoveCallbacks = {}
      state.scopedState[namespace].cancelers = {}

      state.scopedState[namespace].animations = {}
      state.scopedState[namespace].animations.entry = {}
      state.scopedState[namespace].animations.exit = {}
      state.scopedState[namespace].animations.entryF = {}
      state.scopedState[namespace].animations.exitF = {}
      state.scopedState[namespace].animations.entryB = {}
      state.scopedState[namespace].animations.exitB = {}
      state.scopedState[namespace].animations.animationStack = []
      state.scopedState[namespace].animations.animationCache = []
      state.scopedState[namespace].animations.lastAnimatedScreen = ""
      
      if (window.__OS == "ANDROID") {
        if (typeof Android.getNewID == "function") { 
          // TODO change this to mystique version check.
          // TODO add mystique reject / alternate handling, when required version is not present
          Android.render(JSON.stringify(domAll(state.scopedState[namespace].root, "base", namespace)), null, "false", (id ? id : null));
        } else {
          Android.render(JSON.stringify(domAll(state.scopedState[namespace].root), "base", namespace), null);
        }
      } else if (window.__OS == "WEB") {
        Android.Render(domAll(state.scopedState[namespace].root, "base", namespace), null); // Add support for Web
      } else {
        Android.Render(domAll(state.scopedState[namespace].root, "base", namespace), null); // Add support for iOS
      }
    }
  }
}

exports.insertDom = function(namespace, name, dom) {
  if(!state.scopedState[namespace]) {
    console.error("Call initUI for namespace :: " + namespace + "before triggering run/show screen")
    return;
  }
  state.scopedState[namespace].animations.entry[name] = {}
  state.scopedState[namespace].animations.exit[name] = {}
  state.scopedState[namespace].animations.entryF[name] = {}
  state.scopedState[namespace].animations.exitF[name] = {}
  state.scopedState[namespace].animations.entryB[name] = {}
  state.scopedState[namespace].animations.exitB[name] = {}
  state.scopedState[namespace].root.children.push(dom);
  if (dom.props && dom.props.hasOwnProperty('id') && (dom.props.id).toString().trim()) {
    dom.__ref = {__id: (dom.props.id).toString().trim()};
  } else {
    dom.__ref = window.createPrestoElement();
  }
  if(dom.props) {
    dom.props.root = true
  }
  
  // TODO implement cache limit later
  state.scopedState[namespace].screenHideCallbacks[name] = hideViewInNameSpace(dom.__ref.__id)
  state.scopedState[namespace].screenShowCallbacks[name] = showViewInNameSpace(dom.__ref.__id)
  state.scopedState[namespace].screenRemoveCallbacks[name] = removeViewFromNameSpace(namespace, dom.__ref.__id)
  var callback = callbackMapper.map(executePostProcess(name, namespace, false))
  if (window.__OS == "ANDROID") {
    Android.addViewToParent(
      state.scopedState[namespace].root.__ref.__id + "",
      JSON.stringify(domAll(dom, name, namespace)),
      state.scopedState[namespace].screenStack.length - 1,
      callback,
      null,
      state.scopedState[namespace].id ? state.scopedState[namespace].id : null
    );
  } else {
    Android.addViewToParent(rootId, domAll(dom, name, namespace), length - 1, callback, null);
  }
}

exports.storeMachine = function (dom, name, namespace) {
  console.log("HYPER 1",  state)
  state.scopedState[namespace].MACHINE_MAP[name] = dom;
  console.log("HYPER 2",  state)
}

exports.getLatestMachine = function (name, namespace) {
  return state.scopedState[namespace].MACHINE_MAP[name];
}

exports.isInStack = function (name, namespace) {
  // Added || false to return false when value is undefined
  debugger
  try {
    return state.scopedState[namespace].MACHINE_MAP.hasOwnProperty(name) && state.scopedState[namespace].screenStack.indexOf(name) != -1
  } catch (e) {
    console.error( "Call initUI with for namespace :: " + namespace , e );
  }
  return false
}

exports.isCached = function (name, namespace) {
  // Added || false to return false when value is undefined
  try {
    return state.scopedState[namespace].MACHINE_MAP.hasOwnProperty(name) && state.scopedState[namespace].screenCache.hasOwnProperty(name)
  } catch (e) {
    console.error( "Call initUI with for namespace :: " + namespace , e );
  }
  return false
}

exports.cancelExistingActions = function (name, namespace) {
  // Added || false to return false when value is undefined
  if(state.scopedState[namespace] && state.scopedState[namespace].cancelers && typeof state.scopedState[namespace].cancelers[name] == "function") {
    state.scopedState[namespace].cancelers[name]();
  }
}

exports.saveCanceller = function (name, namespace, canceller) {
  // Added || false to return false when value is undefined
  if(state.scopedState[namespace] && state.scopedState[namespace].cancelers) {
    state.scopedState[namespace].cancelers[name] = canceller;
  }
}

exports.terminateUIImpl = function (namespace) {
  if(window.__OS == "ANDROID" 
      && Android.runInUI 
      && state.scopedState[namespace] 
      && state.scopedState[namespace].root 
      && state.scopedState[namespace].root.__ref
      && state.scopedState[namespace].root.__ref.__id
      ) {
    Android.runInUI(";set_v=ctx->findViewById:i_" + state.scopedState[namespace].root.__ref.__id + ";set_p=get_v->getParent;get_p->removeView:get_v;", null);
  } else if ( JOS 
      && JOS.parent 
      && JOS.parent != "java" 
      && state.scopedState[namespace] 
      && state.scopedState[namespace].root 
      && state.scopedState[namespace].root.__ref
      && state.scopedState[namespace].root.__ref.__id
      ) {
      Android.removeView(state.scopedState[namespace].root.__ref.__id);
  } else {
    Android.runInUI(["removeAllUI"], null);
  }
  delete state.scopedState[namespace] 
}

exports.setToTopOfStack = function (namespace, screenName) {
  try {
    if(state.scopedState[namespace].screenStack.indexOf(screenName) != -1) {
      var index = state.scopedState[namespace].screenStack.indexOf(screenName)
      var removedScreens = state.scopedState[namespace].screenStack.splice(index + 1)
      state.scopedState[namespace].removeList = state.scopedState[namespace].removeList.concat(removedScreens)
      removedScreens.forEach(function(screenName) {
        // TODO fix for prerender
        delete state.scopedState[namespace].MACHINE_MAP[screenName]
      })
    } else {
      state.scopedState[namespace].screenStack.push(screenName)
    }

  } catch (e) {
    console.error("Call Init UI for namespace :: ", namespace, e)
  }
}

exports.makeScreenVisible = function (namespace, name) {
  try {
    var cb = state.scopedState[namespace].screenShowCallbacks[name];
    if(typeof cb == "function") {
      cb()
    }
  } catch(e) {
    console.log("Call InitUI first for namespace ", namespace, e)
  }
}