<template>
    <div class="small">
        <a :class="[ 'button', currentData==='Temperature' ? 'is-focused' : '' ]" @click="displayData('Temperature', temperatureData)">Temperature</a>
        <a :class="[ 'button', currentData==='Illuminance' ? 'is-focused' : '' ]" @click="displayData('Illuminance', illuminanceData)">Illuminance</a>
        <a :class="[ 'button', currentData==='Pressure' ? 'is-focused' : '' ]" @click="displayData('Pressure', pressureData)">Pressure</a>
        <a :class="[ 'button', currentData==='Humidity' ? 'is-focused' : '' ]" @click="displayData('Humidity', humidityData)">Humidty</a>

        <div style="position: relative; left: 0; top: 0;">
          <line-chart :chart-data="datacollection" :options = "displayOptions"></line-chart>
          <img :class="['spinner']" v-show="loading" src="./assets/spinner.gif">          
        </div>

        <a :class="[ 'button', currentWindow=='15m' ? 'is-focused' : '' ]" @click="displayWindow('15m')">15m</a>
        <a :class="[ 'button', currentWindow=='1h' ? 'is-focused' : '' ]" @click="displayWindow('1h')">1h</a>
        <a :class="[ 'button', currentWindow=='1d' ? 'is-focused' : '' ]" @click="displayWindow('1d')">1d</a>
        <a :class="[ 'button', currentWindow=='1w' ? 'is-focused' : '' ]" @click="displayWindow('1w')">1w</a>

    </div>
</template>

<script>
  import LineChart from './LineChart.js'
  import Vue from 'vue'
  import VueAxios from 'vue-axios'

  export default {
    components: {
      LineChart
    },
    data () {
      return {
        datacollection: null,
        times: [],
        temperatureData: [],
        illuminanceData: [],
        pressureData: [],
        humidityData: [],
        currentData: "Temperature",
        currentWindow: "15m",
        loading: false,
        displayOptions: { 
          scales: {
              xAxes: [{
                  type: 'time',
                  time: {
                      unit: 'minute',
                  }
              }]
          }
        }
      }
    },
    created () {
      this.$store.watch(
          (state, getters) => getters.activeDevice,
          (newValue, oldValue) => {
            this.updateData(newValue);             
          }
      );
    },
    mounted () {      
      this.updateData();
    },
    methods: {
      updateData(newId) {
        var id = this.$store.state.devices[this.$store.state.activeDevice].id; // todo use newValue from watcher

        var _this = this;

        _this.times = [];
        _this.illuminanceData = [];
        _this.temperatureData = [];
        _this.pressureData = [];
        _this.humidityData = [];

        var query = "";

        if( _this.currentWindow == '1h' ) {
          query = "/summary?period=hour&avg_over=1";
        } else if( _this.currentWindow == '1d' ) {
          query = "/summary?period=day&avg_over=15";
        } else if( _this.query == '1w' ) {
          query = "/summary?period=week&avg_over=60";
        }

        _this.loading = true;

        Vue.axios.get('http://iotcommunicator-alb-176802839.us-west-2.elb.amazonaws.com/devices/' + id + query).then(function (response) {
          if(response.status == "200") {

            if( _this.currentWindow == "15m" ) {
              Array.from(response.data).forEach(element => {
                _this.times.push( parseInt(element.metric_time.S, 10) ); 
                _this.illuminanceData.push(element.metrics.M.illuminance.N);  
                _this.temperatureData.push(element.metrics.M.temperature.N);
                _this.pressureData.push(element.metrics.M.pressure.N);
                _this.humidityData.push(element.metrics.M.humidity.N);                                 
              });
            } else {
              _this.times = Object.keys(response.data);
              
              Array.from(_this.times).forEach(element => {                
                _this.illuminanceData.push(response.data[element].illuminance);  
                _this.temperatureData.push(response.data[element].temperature);
                _this.pressureData.push(response.data[element].pressure);
                _this.humidityData.push(response.data[element].humidity);                                             
              });
            }
            
            _this.loading = false;

            if( _this.currentData == 'Temperature' ) {
              _this.displayData('Temperature', _this.temperatureData);
            } else if( _this.currentData == 'Illuminance' ) {
              _this.displayData('Illuminance', _this.illuminanceData);
            } else if( _this.currentData == 'Pressure' ) {
              _this.displayData('Pressure', _this.pressureData);
            } else if( _this.currentData == 'Humidity' ) {
              _this.displayData('Humidity', _this.humidityData);
            }           
          }        
        });  
      },
      displayData(_label, _data) {
        this.currentData = _label;
        this.datacollection = {
          labels: this.times,
          datasets: [
            {
              label: _label,
              //backgroundColor: '#f87979',
              data: _data,
            }
          ]
        }
      },
      displayWindow(window) {
        this.currentWindow = window;
        this.updateData( this.id );
      },
    }
  }
</script>

<style>
  .small {
    max-width: 600px;
    max-height: 300px;
    margin:  100px auto;
  }
  .spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    opacity: 0.3;
  }  
</style>