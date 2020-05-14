<template>
    <div>
        <nav class="panel">
            <p class="panel-heading">
                IoT Devices
            </p>
            <a v-for="(deviceId, index) in activeDevices"
                @click="selectDevice(deviceId)"
                @contextmenu.prevent.stop="handleClick($event, deviceId)" 
                :class="[ 'panel-block', activeDevice===deviceId ? 'is-active' : '' ]">
                <span class="panel-icon">
                    <i class="fas fa-microchip" aria-hidden="true"></i>
                </span>
                {{devices[deviceId].name}}
            </a>
        </nav>

        <vue-simple-context-menu
            :elementId="'contextMenu'"
            :options="optionsArray"
            :ref="'vueSimpleContextMenu'"
            @option-clicked="optionClicked"
        >
        </vue-simple-context-menu>
    </div>
</template>

<script>
    import 'vue-simple-context-menu/dist/vue-simple-context-menu.css';

    import Vue from 'vue'

    export default {

        computed: {
            devices() {
                return this.$store.state.devices;
            },
            activeDevice() {
                return this.$store.state.activeDevice;
            },
            viewer() {
                return this.$store.state.viewer;
            },
            activeDevices() {
                return this.$store.state.activeDevices;
            }
        },
        data() {
            return {
                optionsArray: [
                    {
                        name: 'Goto',
                        slug: 'goto'
                    },
                    {
                        name: 'Move',
                        slug: 'move'
                    },
                    {
                        name: 'Set Alarm...',
                        slug: 'set-alarm'
                    }
                ],
            };
        },
        methods: {
            selectDevice(index) {
                this.$store.dispatch('setActiveDevice', index);
            },
            handleClick(event, item) {
                this.$refs.vueSimpleContextMenu.showMenu(event, item)
            },
            optionClicked(event) {
                if( event.option.slug === "move" ) {
                    this.$store.dispatch('setMoveDevice', event.item );            
                } else if( event.option.slug === "goto" ) {
                    this.$store.dispatch('setGotoDevice', event.item );
                } else if( event.option.slug === "set-alarm" ) {
                    this.$store.dispatch('setAlarmModalVisible', true );
                }
            },
            setVisibility(obj) {
                this.$store.commit('setDeviceVisibility', obj);
            },
        }
    }
</script>