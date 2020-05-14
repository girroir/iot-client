<template>
    <div v-bind:style="{visibility: this.floorMapVisibility, top: this.top, left: this.left}" id="floorMap-div"></div>
</template>

<script type="text/javascript" src="FloorMapOperator.js"></script>
<script type="text/javascript" src="StatusMarkupItem.js"></script>
<script type="text/javascript" src="CustomMarkupItem.js"></script>

<script>
    import FloorMapOperator from './FloorMapOperator.js'
    import StatusMarkupItem from './StatusMarkupItem.js'
    import CustomMarkupItem from './CustomMarkupItem.js'

    export default {
        created() {
            this.$options.sockets.onmessage = (data) => {
                if ("hidden" == this.floorMapVisibility) {
                    return;
                }

                let obj = JSON.parse(data.data);
                let deviceId = -1;

                this.devices.forEach((device, index) => {
                    if( device.id == obj.Sensor) {
                        deviceId = index;
                    }
                })

                if( deviceId < this.statusMarkUpArr.length) {
                    let deviceClass = this.statusMarkUpArr[deviceId];

                    // Temperature status
                    let temp = obj.temperature;
                    let tempCol = this.CalcColor(temp, -10, 40);
                    deviceClass[0].setColor(new Communicator.Color(255 * tempCol[0], 255 * tempCol[1], 255 * tempCol[2]));
                    deviceClass[0].blinkMarkup();

                    // Humidity status
                    let humi = obj.humidity;
                    let humiCol = this.CalcColor(humi, 0, 100);
                    deviceClass[1].setColor(new Communicator.Color(255 * humiCol[0], 255 * humiCol[1], 255 * humiCol[2]));
                    deviceClass[1].blinkMarkup();

                    // Illuminance status
                    let illu = obj.illuminance;
                    let illuCol = this.CalcColor(illu, 0, this.illuminanceMax);
                    deviceClass[2].setColor(new Communicator.Color(255 * illuCol[0], 255 * illuCol[1], 255 * illuCol[2]));
                    deviceClass[2].blinkMarkup();

                    // Pressure status
                    let pres = obj.pressure;
                    let presCol = this.CalcColor(pres, 90, 110);
                    deviceClass[3].setColor(new Communicator.Color(255 * presCol[0], 255 * presCol[1], 255 * presCol[2]));
                    deviceClass[3].blinkMarkup();

                    let content = "Device " + obj.Sensor +
                        "\nTemperature: " + String(Math.round(obj.temperature * 10) / 10) + " ℃\n" +
                        "\nHumidity: " + String(Math.round(obj.humidity * 10) / 10) + " %\n" +
                        "\nIlluminance: " + String(Math.round(obj.illuminance * 10) / 10) + " lx\n" +
                        "\nPressure: " + String(Math.round(obj.pressure * 100) / 10) + " hPa\n";

                    this.markup[deviceId]._textBox.setTextString(content); 
                    this.floorMap.markupManager.refreshMarkup(); 
                }
            },
            this.$store.watch(
                (state, getters) => getters.activeMarkupId,
                (newValue, oldValue) => {
                    if(newValue != oldValue) {
                        if ("" != this.activeUid) {
                            this.floorMap.markupManager.unregisterMarkup(this.activeUid);
                            this.activeUid = "";
                        }

                        if( -1 < newValue) {
                            this.activeUid = this.floorMap.markupManager.registerMarkup(this.markup[newValue]);
                        }
                    }
                },
            );
        },
        computed: {
            floorMap() {
                return this.$store.state.floorMap;
            },
            devices() {
                return this.$store.state.devices;
            },
            floorMapVisibility() {
                return this.$store.state.walkMode ? 'visible' : 'hidden';;
            },
            illuminanceMax() {
                return this.$store.state.illuminanceMax
            }
        },
        data() {
            return {
                floorMapHdl: undefined,
                statusMarkUpArr: [],
                markup: [],
                markup_uids: [],
                activeUid: "",
                top: '450px',
                left: '400px'
            }
        },
        mounted: function() {
            // Ajust position
            this.resizeHandler();

            // Create viewer
            var hwv = new Communicator.WebViewer({
                containerId: "floorMap-div",
                streamingMode: 1,
                endpointUri: "./models/techsoft3D_Building_v03.scs",
            });
            this.$store.commit('setFloorMap', hwv);

            this.floorMap.setCallbacks({
                sceneReady: () => {
                    var cameraString = '{"position":{"x":17250,"y":10640,"z":22471},"target":{"x":17250,"y":10640,"z":0.5},"up":{"x":0,"y":1,"z":0},"width":29961,"height":29961,"projection":0,"nearLimit":0.01,"className":"Communicator.Camera"}'
                    var json = JSON.parse(cameraString);
                    var camera = new Communicator.Camera.construct(json);
                    this.floorMap.view.setCamera(camera);

                    // Set background color
                    this.floorMap.view.setBackgroundColor(null, new Communicator.Color(128, 128, 128));

                    // assign panning to mouse right cutton
                    var operatorId = Communicator.OperatorId.Pan;
                    var operator = this.floorMap.operatorManager.getOperator(operatorId);
                    operator.setMapping(Communicator.Button.Left);

                    this.devices.forEach((device, index) => {
                        // create status markups
                        let deviceClass = [];
                        let centPos = new Communicator.Point3(device.location[0], device.location[1], device.location[2] + 500)

                        // Temperature status
                        let tempPos = new Communicator.Point3(centPos.x, centPos.y, centPos.z); 
                        let tempMarkup = new StatusMarkupItem(this.floorMap, tempPos, -5, 5, index);
                        this.floorMap.markupManager.registerMarkup(tempMarkup);
                        deviceClass.push(tempMarkup);

                        // Humidity status
                        let humiPos = new Communicator.Point3(centPos.x, centPos.y, centPos.z); 
                        let humiMarkup = new StatusMarkupItem(this.floorMap, humiPos, 5, 5, index);
                        this.floorMap.markupManager.registerMarkup(humiMarkup);
                        deviceClass.push(humiMarkup);

                        // Illuminance status
                        let illuPos = new Communicator.Point3(centPos.x, centPos.y, centPos.z); 
                        let illuMarkup = new StatusMarkupItem(this.floorMap, illuPos, -5, -5, index);
                        this.floorMap.markupManager.registerMarkup(illuMarkup);
                        deviceClass.push(illuMarkup);

                        // Pressure status
                        let presPos = new Communicator.Point3(centPos.x, centPos.y, centPos.z); 
                        let presMarkup = new StatusMarkupItem(this.floorMap, presPos, 5, -5, index);
                        this.floorMap.markupManager.registerMarkup(presMarkup);
                        deviceClass.push(presMarkup);

                        this.statusMarkUpArr.push(deviceClass);

                        // Create markup item
                        let width = $('#floorMap-div').width();
                        let height = $('#floorMap-div').height();
                        let markup = new CustomMarkupItem(this.floorMap, -5, "", centPos,
                            new Communicator.Point3(0,0,1), 500, width, height)

                        let content = "Device: " + index +
                        "\nTemperature: No signal\n" +
                        "\nHumidity: No signal\n" +
                        "\nIlluminance: No signal\n" +
                        "\nPressure: No signal\n";
                        markup._textBox.setTextString(content); 

                        this.markup.push(markup);
                    });
                },
                modelStructureReady: function () {
                },
            });

            let floorMapOp = new FloorMapOperator(this.floorMap, this);
            let floorMapHdle = this.floorMap.registerCustomOperator(floorMapOp);
            this.$store.commit('setFloorMapOperator', floorMapOp);
            
            this.floorMap.start();

            // Set operators
            this.floorMap.operatorManager.clear();
            this.floorMap.operatorManager.push(Communicator.OperatorId.Zoom);
            this.floorMap.operatorManager.push(Communicator.OperatorId.Pan);
            this.floorMap.operatorManager.push(floorMapHdle);

            addEventListener('resize', this.resizeHandler);
        },
        beforeDestroy: function() {
            removeEventListener('resize', this.resizeHandler);
        },
        methods: {
            CalcColor(dVal, dMin, dMax) {
                let dCol = [3];
                let dPi2 = Math.PI * 0.5;
                let dMid = (dMax + dMin) / 2.0;
                let dLen = (dMax - dMin) / 2.0;

                if (dVal > dMid) {
                    let d = dPi2 * (dVal - dMid) / dLen;
                    dCol[0] = Math.sin(d);
                    dCol[1] = Math.cos(d);
                    dCol[2] = 0.0;
                }
                else if (dVal < dMid) {
                    let d = dPi2 * (dVal - dMin) / dLen;
                    dCol[0] = 0.0;
                    dCol[1] = Math.sin(d);
                    dCol[2] = Math.cos(d);
                }
                else {
                    dCol[0] = 0.0;
                    dCol[1] = 1.0;
                    dCol[2] = 1.0;
                }
                return dCol;
            },
            resizeHandler() {
                let off = $('#viewer-div').offset();
                this.left = String(off.left) + 'px';
                this.top = String(off.top + $('#viewer-div').height() - $('#floorMap-div').height()) + 'px';
            }
        }
    }
</script>

<style scoped>
#floorMap-div {
    position: absolute;
    width: 400px;
    height: 300px;
    border-style: solid;
    border-color: #808080;
    border-width: thin;
    visibility: hidden
}
</style>