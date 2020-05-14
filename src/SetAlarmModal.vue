<template>
    <div :class="[ 'modal', setAlarmModalVisible===true ? 'is-active' : '' ]"> 
        <div class="modal-background">
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">Set Alarm: {{devices[activeDevice].name}}</p>
                    <button class="delete" aria-label="close" @click="onCancel()"></button>
                </header>
                <section class="modal-card-body">
                    <div>
                        <div class="dropdown is-hoverable">
                            <div class="dropdown-trigger">
                                <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
                                <span>{{property}}</span>
                                <span class="icon is-small">
                                    <i class="fas fa-angle-down" aria-hidden="true"></i>
                                </span>
                                </button>
                            </div>
                            <div class="dropdown-menu" id="dropdown-menu" role="menu">
                                <div class="dropdown-content" >
                                    <a v-for="(prop, index) in propertiesList" @click="property = propertiesList[index]" class="dropdown-item">
                                    {{prop}}
                                </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <br>

                    <div>
                        <div class="dropdown is-hoverable">
                            <div class="dropdown-trigger">
                                <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
                                <span>{{operation}}</span>
                                <span class="icon is-small">
                                    <i class="fas fa-angle-down" aria-hidden="true"></i>
                                </span>
                                </button>
                            </div>
                            <div class="dropdown-menu" id="dropdown-menu" role="menu">
                                <div class="dropdown-content">
                                <a @click="operation = 'Greater than'" class="dropdown-item">
                                    Greater than
                                </a>
                                <a @click="operation = 'Lesser than'" class="dropdown-item">
                                    Lesser than
                                </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <br>

                    <div>
                        <input class="input" type="text" placeholder="Text input" v-model="val">
                    </div>
   
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-success" @click="onOk()">Ok</button>
                    <button class="button" @click="onCancel()">Cancel</button>
                </footer>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                property: "Temperature",
                operation: "Greater than",
                val: 0,
            };
        },
        computed: {
            devices() {
                return this.$store.state.devices;
            },
            activeDevice() {
                return this.$store.state.activeDevice;
            },
            setAlarmModalVisible() {
                return this.$store.state.setAlarmModalVisible;
            },
            propertiesList() {
                if(this.devices[this.activeDevice].sensorData) {
                    var list = Object.keys(this.devices[this.activeDevice].sensorData);
                    list.shift(); // remove "Sensor"
                    list.forEach(function(element, index) {
                        list[index] = element.substr(0,1).toUpperCase() + element.substr(1);
                    });
                } else {
                    return [""];
                }
            }        
        },
        methods: {
            onCancel() {
                this.$store.dispatch('setAlarmModalVisible', false);
            },
            onOk() {
                var alarm = {
                    property: this.property, 
                    operation: this.operation, 
                    val: this.val
                }
                this.$store.commit('setAlarm', alarm);
                this.$store.commit('setAlarmModalVisible', false);
            },
        }
    }
</script>