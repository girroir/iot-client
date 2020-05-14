import Vue from 'vue'
import App from './App.vue'

import VueNativeSock from 'vue-native-websocket'

import axios from 'axios'
import VueAxios from 'vue-axios'

import Vuex from 'vuex';

import VueSimpleContextMenu from 'vue-simple-context-menu'
Vue.component('vue-simple-context-menu', VueSimpleContextMenu)

Vue.use(VueAxios, axios);
Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    activeDevice: 0,
    activeDevices: [],
    devices: [
      { name: 'Device 0 - Empty', id: 0, location: [0, 0, 0] },
      { name: 'Device 1 - Robert', id: 1, title: 'Colorado (UTC -7)', TD: -7, location: [10050, 19400, 3000], barometerPosition: {x: 8400, y: 18775, z: 800, a: -90}, chartArea: {position: {x: 8350, y: 17950, z: 200, a: 90}, size: {w: 2850, h: 2200}}, camera: '{"position":{"x":11404.511794805549,"y":19911.413565469673,"z":1977.1473067519526},"target":{"x":9670.19790539842,"y":19428.022552560018,"z":1806.5954138125628},"up":{"x":-0.09084411076011714,"y":-0.025320230083737343,"z":0.9955431851450294},"width":1941.6920485204794,"height":1941.6920485204794,"projection":1,"nearLimit":0.01,"className":"Communicator.Camera"}' },
      { name: 'Device 2 - Lobby', id: 2, title: 'Bend office lobby', TD: -8, location: [2550, 5000, 3000], barometerPosition: {x: 1170, y: 7100, z: 650, a: 180}, chartArea: {position: {x: 0, y: 7150, z: 200, a: 0}, size: {w: 4000, h: 2200}}, camera: '{"position":{"x":2681.7891390752106,"y":3766.298850434718,"z":2183.8578970761732},"target":{"x":2156.17966822154,"y":5476.3720291424725,"z":1919.313204914729},"up":{"x":-0.04297657423574441,"y":0.13982451038015947,"z":0.989243205871998},"width":1942.1650236992393,"height":1942.1650236992393,"projection":1,"nearLimit":0.01,"className":"Communicator.Camera"}' },
      { name: 'Device 3 - Peter', id: 3, title: 'Staveley (UTC)', TD: 0, location: [13600, 19400, 3000], barometerPosition: {x: 12725, y: 20900, z: 2000, a: 180}, chartArea: {position: {x: 12100, y: 18800, z: 100, a: 90}, size: {w: 2100, h: 2600}}, camera: '{"position":{"x":14755.029603830073,"y":17854.165228255577,"z":1864.6410363554699},"target":{"x":13318.815276576779,"y":18939.890766568402,"z":1694.0891434160822},"up":{"x":-0.07522952691387672,"y":0.05687077273612446,"z":0.9955431851450295},"width":1942.3547252514695,"height":1942.3547252514695,"projection":1,"nearLimit":0.01,"className":"Communicator.Camera"}' },
      { name: 'Device 4 - Brad', id: 4, title: 'Pennsylvania (UTC -5)', TD: -5, location: [17150, 19400, 3000], barometerPosition: {x: 15500, y: 18775, z: 800, a: -90}, chartArea: {position: {x: 15450, y: 17950, z: 200, a: 90}, size: {w: 2850, h: 2200}}, camera: '{"position":{"x":18571.218508025293,"y":19757.570745948116,"z":1919.856003783202},"target":{"x":16837.480108966323,"y":19248.688894035015,"z":1843.7645393509238},"up":{"x":-0.04037168729430278,"y":-0.011849780224244006,"z":0.9991144626986681},"width":1941.8223852295916,"height":1941.8223852295916,"projection":1,"nearLimit":0.01,"className":"Communicator.Camera"}' },
      { name: 'Device 5 - Conf', id: 5, title: 'Conference room', TD: -8, location: [14500, 10000, 3000], barometerPosition: {x: 11200, y: 11800, z: 2000, a: -90}, chartArea: {position: {x: 11300, y: 12950, z: 200, a: 0}, size: {w: 6400, h: 2600}}, camera: '{"position":{"x":16372.44868121062,"y":8608.137687837843,"z":2147.1042233457015},"target":{"x":15724.67122083045,"y":10258.275231662406,"z":1789.2915142064558},"up":{"x":-0.0722978634924841,"y":0.18417037668651703,"z":0.9802317538651605},"width":1941.1201775550137,"height":1941.1201775550137,"projection":1,"nearLimit":0.01,"className":"Communicator.Camera"}' },
      { name: 'Device 6 - Tony', id: 6, title: 'Tony', TD: -8, location: [32900, 15200, 3000], barometerPosition: {x: 33200, y: 12900, z: 1800, a: 0}, chartArea: {position: {x: 34350, y: 17400, z: 200, a: -90}, size: {w: 4400, h: 2200}}, camera: '{"position":{"x":31509.241992668947,"y":16983.735661620514,"z":2022.9309202636716},"target":{"x":32974.627530380894,"y":15986.131141993315,"z":1665.1182111244248},"up":{"x":0.1635503703805657,"y":-0.11134174896601648,"z":0.9802317538651604},"width":1941.93156705932,"height":1941.93156705932,"projection":1,"nearLimit":0.01,"className":"Communicator.Camera"}' },
      { name: 'Device 7 - Jonathan', id: 7, title: 'Jonathan', TD: -8, location: [26200, 1600, 3000], barometerPosition: {x: 26035, y: 3450, z: 800, a: 180}, chartArea: {position: {x: 25000, y: 3500, z: 200, a: 0}, size: {w: 3550, h: 2200}}, camera: '{"position":{"x":24833.30859360694,"y":531.7328888358543,"z":1969.0466565957001},"target":{"x":25286.75117046851,"y":2274.1167064378897,"z":1798.4947636563104},"up":{"x":0.023751518065652434,"y":0.091266817085219,"z":0.9955431851450294},"width":1941.553447336579,"height":1941.553447336579,"projection":1,"nearLimit":0.01,"className":"Communicator.Camera"}' },
      { name: 'Device 8 - Toshi', id: 8, title: 'Yokohama (UTC +9)', TD: 9, location: [20700, 19400, 3000], barometerPosition: {x: 21150, y: 17750, z: 1800, a: 0}, chartArea: {position: {x: 22350, y: 20800, z: 200, a: -90}, size: {w: 2850, h: 2200}}, camera: '{"position":{"x":19363.97584456543,"y":19993.501627430036,"z":1919.9825973749987},"target":{"x":21041.336421451306,"y":19344.405518416293,"z":1730.944974374142},"up":{"x":0.09748391584218809,"y":-0.037723809261133376,"z":0.9945218953682733},"width":1941.822385229415,"height":1941.822385229415,"projection":1,"nearLimit":0.01,"className":"Communicator.Camera"}' },
    ],
    markupVisibility: true,
    modelTransparency: 1,
    walkMode: false,
    floorMap: null,
    floorMapOperator: null,
    cameraChangedFromDraw: false,
    cameraPoint: Communicator.Point3.zero(),
    cameraAngle: 0,
    activeMarkupId: -1,
    illuminanceMax: 1000,
    defaultCamera: '{"position":{"x":21675,"y":-7109,"z":16400},"target":{"x":16732,"y":9653,"z":840},"up":{"x":-0.13,"y":0.65,"z":0.75},"width":23400,"height":23400,"projection":0,"nearLimit":0.01,"className":"Communicator.Camera"}',
    gotoDevice: null,
    moveDevice: null,
    activeSensorData: {},
    setAlarmModalVisible: false,
    alarmModalVisible: false,
    alarmDevice: 0,
    alarm: null,
  },
  getters: {
    activeDevice: state => state.activeDevice, // TODO rename selectedSensor, also remove all mentions to "device" and use sensor
    activeDevices: state => state.activeDevices,
    devices: state => state.devices,
    markupVisibility: state => state.markupVisibility,
    modelTransparency: state => state.modelTransparency,
    walkMode: state => state.walkMode,
    cameraPoint: state => state.cameraPoint,
    cameraAngle: state => state.cameraAngle,
    activeMarkupId: state => state.activeMarkupId,
    gotoDevice: state => state.gotoDevice,
    moveDevice: state => state.moveDevice,
    activeSensorData: state => state.activeSensorData, // TODO rename selectedSensorData
    alarm: state => state.alarm,
  },
  mutations: {
    setActiveDevice(state, id) {
      state.activeDevice = id;
    },
    setAddDeviceModalVisible(state, visible) {
      state.addDeviceModalVisible = visible;
    },
    setMarkupVisibility(state, visibility) {
      state.markupVisibility = visibility;
    },
    setGotoDevice(state, id) {
      state.gotoDevice = id;
    },
    setMoveDevice(state, id) {
      state.moveDevice = id;
    },
    setModelTransparency(state, transparency) {
      state.modelTransparency = transparency;
    },
    setWalkMode(state, walk) {
      state.walkMode = walk;
    },
    setFloorMap(state, viewer) {
      state.floorMap = viewer;
    },
    setFloorMapOperator(state, op) {
      state.floorMapOperator = op;
    },
    setCameraChangedFromDraw(state, val) {
      state.cameraChangedFromDraw = val;
    },
    setCameraPoint(state, point3) {
      state.cameraPoint = point3;
    },
    setCameraAngle(state, angle) {
      state.cameraAngle = angle;
    },
    setActiveMarkupId(state, id) {
      state.activeMarkupId = id;
    },
    SOCKET_ONOPEN() {
    },
    SOCKET_ONMESSAGE(state, data) {
      state.devices[data.Sensor].sensorData = data;

      // process alarm
      if( state.devices[data.Sensor].alarmSettings != undefined ) {
        var alarmSettings = state.devices[data.Sensor].alarmSettings;
        var val = data[alarmSettings.property.toLowerCase()];
        if( alarmSettings.operation == "Greater than") {
          if( val > alarmSettings.val ) {
            if( state.alarm == null || !state.alarm.dismissed) {
              state.alarmModalVisible = true;
              state.alarm = {
                id: data.Sensor,
                dismissed: false,
              }
            }
          } else {
            state.alarm = null;
          }
        } else {
          if( val < alarmSettings.val ) {
            if( state.alarm == null || !state.alarm.dismissed) {
              state.alarmModalVisible = true;
              state.alarm = {
                id: data.Sensor,
                dismissed: false,
              }
            }
          } else {
            state.alarm = null;
          }
        }
      }

      let found = state.activeDevices.find(element => element == data.Sensor);
      if( !found ) {
        state.activeDevices.push( data.Sensor );
        if( state.activeDevices.length == 1) {
          state.activeDevice = data.Sensor;
        }
      }

      state.activeSensorData = data;
    },
    setAlarmModalVisible(state, val) {
      state.setAlarmModalVisible = val;
    },
    setAlarm(state, alarmSettings) {
      state.devices[ state.activeDevice ].alarmSettings = alarmSettings;
    },
    alarmModalVisible(state, vis) {
      state.alarmModalVisible = vis;
    },
    deleteAlarm(state, id) {
      state.devices[id].alarmSettings = undefined;
      state.alarm = null;
    },
    dismissAlarm(state, id ) {
      state.alarm.dismissed = true;
    }
  },
  actions: {
    setActiveDevice(context, id) {
      context.commit('setActiveDevice', id);
    },
    setMarkupVisibility(context, visibility) {
      context.commit('setMarkupVisibility', visibility);
    },
    setModelTransparency(context, transparency) {
      context.commit('setModelTransparency', transparency);
    },
    setGotoDevice(context, id) {
      context.commit('setGotoDevice', id);
    },
    setMoveDevice(context, id) {
      context.commit('setMoveDevice', id);
    },
    setAlarmModalVisible(context, id) {
      context.commit('setAlarmModalVisible', id);
    }
  }
});

//Vue.use(VueNativeSock, 'ws:54.245.6.156:9001', {store: store, format: 'json'})

new Vue({
  el: '#app',
  render: h => h(App),
  store: store
})
