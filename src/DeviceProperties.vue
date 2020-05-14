<template>
    <div>
        <nav class="panel">
            <p class="panel-heading">Device Properties</p>
            <p class="panel-block" v-for="d in Object.keys(sensorData)">{{d.replace(/^\w/, c => c.toUpperCase()) }}: {{sensorData[d]}}</p>
        </nav>
    </div>
</template>

<script>

    export default {
        data() {
            return {
                sensorData: [],
            };
        },
        created() {
            this.$store.watch(
                (state, getters) => getters.activeSensorData,
                (newValue, oldValue) => {   
                    if( newValue.Sensor == this.$store.state.activeDevice) {
                        this.sensorData = newValue; 
                    }       
                }
            );

            this.$store.watch(
                (state, getters) => getters.activeDevice,
                (newValue, oldValue) => {   
                    this.sensorData = this.$store.state.devices[newValue].sensorData;       
                }
            );
            
        },       
    }
</script>