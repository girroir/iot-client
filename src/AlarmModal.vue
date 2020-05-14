<template>
    <div :class="[ 'modal', alarmModalVisible===true ? 'is-active' : '' ]"> 
        <div class="modal-background">
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">Alarm: {{devices[alarmDevice].name}}</p>
                    <button class="delete" aria-label="close" @click="onOk()"></button>
                </header>

                <footer class="modal-card-foot">
                    <button class="button" @click="onGoto()">Goto</button>
                    <button class="button" @click="onDelete()">Delete</button>
                    <button class="button" @click="onDismiss()">Dismiss</button>
                    <button class="button" @click="onOk()">Ok</button>
                </footer>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
            };
        },
        computed: {
            devices() {
                return this.$store.state.devices;
            },
            alarmModalVisible() {
                return this.$store.state.alarmModalVisible;
            },
            alarmDevice() {
                if( this.$store.state.alarm ) {
                    return this.$store.state.alarm.id;
                } else {
                    return 0;
                }
            }
        },
        methods: {
            onGoto() {
                this.$store.commit('alarmModalVisible', false);
                this.$store.commit('setGotoDevice', this.alarmDevice);
            },
            onDelete() {
                this.$store.commit('alarmModalVisible', false);
                this.$store.commit('deleteAlarm', this.alarmDevice);
            },
            onDismiss() {
                this.$store.commit('alarmModalVisible', false);
                this.$store.commit('dismissAlarm', this.alarmDevice);
            },
            onOk() {
                this.$store.commit('alarmModalVisible', false);
            }
        }
    }
</script>