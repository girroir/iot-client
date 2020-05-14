<template>
    <div>
    	<div style="width: 100%; height: calc(100vh - 105px); display:block; position: relative;" id="viewer-div"></div>
		<appFloorMap></appFloorMap>
        <div class="colorTitle" v-bind:style="{left: this.illumTitle.left, top: this.illumTitle.top}">Illuminance (xl)</div>
        <div v-for="item in this.illumItems" v-bind:key="item.id">
            <div class="colorLabel" v-bind:style="{left: item.left, top: item.top}">{{item.label}}</div>
        </div>
    </div>
</template>

<script type="text/javascript" src="CustomMarkupItem.js"></script>
<script type="text/javascript" src="CustomWalkOperator.js"></script>
<script type="text/javascript" src="ChartMesh.js"></script>
<script type="text/javascript" src="ColorContour.js"></script>

<script>
    import CustomMarkupItem from './CustomMarkupItem.js'
    import CustomWalkOperator from './CustomWalkOperator.js'
    import ChartMesh from './ChartMesh.js'
    import FloorMap from './FloorMap.vue'
    import ColorContour from './ColorContour.js'

    let viewer; 
    
    export default {
        components: {
            appFloorMap: FloorMap
        },
        created() {
            this.$store.watch(
                (state, getters) => getters.markupVisibility,
                (newValue, oldValue) => {
                    
                    if( newValue ) {
                        var _this = this;
                        this.markup.forEach(function(markupItem) {
                            var uid = _this.viewer.markupManager.registerMarkup(markupItem);
                            _this.markup_uids.set(markupItem.Sensor, uid);
                        })
                    } else {     
                        var _this = this;                
                        this.markup_uids.forEach(function(uid) {
                            _this.viewer.markupManager.unregisterMarkup(uid);
                        })
                        this.markup.uids = [];
                    }
                },
            );

            this.$store.watch(
                (state, getters) => getters.modelTransparency,
                (newValue, oldValue) => {
                    this.viewer.getModel().setNodesOpacity([13, 14], newValue);
                },
            );

            this.$store.watch(
                (state, getters) => getters.walkMode,
                (newValue, oldValue) => {
                    // Enter / Exit walk mode
                    let currentCamera = this.viewer.view.getCamera();                    

                    if (undefined == this.lastCamera) {
                        let camersStr = this.devices[4].camera;
                        let json = JSON.parse(camersStr);
                        this.lastCamera = new Communicator.Camera.construct(json);
                    }
                    this.viewer.view.setCamera(this.lastCamera);
                    
                    if (newValue) {
                        // Walk mode On
                        if (this.$store.state.markupVisibility) {
                            this.lastMkuVisibility = true;
                        } else {
                            this.lastMkuVisibility = false;
                        }
                        this.viewer.operatorManager.set(this.customWalkOpHandle, 0);
                        if (this.lastMkuVisibility) {
                            this.$store.commit('setMarkupVisibility', false);
                        }
                    } else {
                        // Walk mode Off
                        this.viewer.operatorManager.set(Communicator.OperatorId.Navigate, 0);
                        if (this.lastMkuVisibility) {
                            this.$store.commit('setMarkupVisibility', true);
                        }
                    }

                    this.lastCamera = currentCamera;
                },
            );
            this.$store.watch(
                (state, getters) => getters.cameraPoint,
                (newValue, oldValue) => {
                    // get current camera
                    let camera = this.viewer.view.getCamera();
                    let position = camera.getPosition();
                    let target = camera.getTarget();

                    // new camera position
                    let newPosition = new Communicator.Point3(newValue.x, newValue.y, position.z);

                    // camera target
                    let newTarget = Communicator.Point3.add(newPosition, target.subtract(position));

                    // set camera
                    camera.setPosition(newPosition);
                    camera.setTarget(newTarget);

                    this.viewer.view.setCamera(camera, 100);
                },
            );
            this.$store.watch(
                (state, getters) => getters.cameraAngle,
                (newValue, oldValue) => {
                    // get current camera
                    var camera = this.viewer.view.getCamera();
                    var position = camera.getPosition();
                    var target = camera.getTarget();
                    var up = camera.getUp();

                    // rotate matrix
                    var vZ = new Communicator.Point3(0, 0, 1);
                    var matrixR = new Communicator.Matrix.createFromOffAxisRotation(vZ, newValue);

                    // rotate target
                    var originToTarget = new Communicator.Point3.subtract(target, position);
                    var newTarget = Communicator.Point3.zero();
                    matrixR.transform(originToTarget, newTarget);
                    newTarget.add(position);

                    // rotate up
                    var newUp = Communicator.Point3.zero();
                    matrixR.transform(up, newUp);

                    // set camera
                    camera.setTarget(newTarget);
                    camera.setUp(newUp);

                    this.viewer.view.setCamera(camera, 0);
                },
            );

            this.$store.watch(
                (state, getters) => getters.gotoDevice,
                (newValue, oldValue) => {
                    if( newValue != null) {
                        this.viewer.getView().fitNodes([ this.devices[newValue].instanceId ], 500);
                        this.$store.dispatch('setGotoDevice', null );
                    }
                },
            );
         
            this.$store.watch(
                (state, getters) => getters.moveDevice,
                (newValue, oldValue) => {
                    if( newValue != null) {
                        const handleOperator = this.viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
                        handleOperator.addHandles([ this.devices[newValue].instanceId ]); 
                        this.$store.dispatch('setMoveDevice', null );
                    }
                },
            );

            this.$store.watch(
                (state, getters) => getters.activeDevice,
                (newValue, oldValue) => {
                    if (!this.$store.state.walkMode) {
                        this.viewer.selectionManager.selectNode(this.devices[newValue].instanceId);
                    } else {
                        let cameraStr = this.devices[newValue].camera;
                        if (undefined != cameraStr) {
                            let json = JSON.parse(cameraStr);
                            this.viewer.view.setCamera(new Communicator.Camera.construct(json), 500);
                        }                        
                    }
                },
            ); 

            this.$store.watch(
                (state, getters) => getters.activeDevices,
                (newValue, oldValue) => {
                    // Assume that only new devices are being added to the end of the array
                    var device = this.devices[newValue[newValue.length-1]];   

                    if( this.sceneReady ) {
                        this.addDevice( device );
                    } else {
                        this.pendingDevices.push( device );
                    }
                },
            );
            
            this.$store.watch(
                (state, getters) => getters.activeSensorData,
                (newValue, oldValue) => {

                    var content = this.createNote(newValue);

                    if( this.markup.get(newValue.Sensor) != undefined ) {
                        this.markup.get(newValue.Sensor)._textBox.setTextString(content); 
                    }
                    
                    if( this.viewer != undefined ) {
                        this.viewer.markupManager.refreshMarkup(); 
                    }

                    if( this.devices == undefined ) {
                        retrun;
                    }

                    let _device = this.devices[newValue.Sensor];

                    if (undefined != _device.instanceId) {
                        let color = this.CalcColor(newValue.illuminance, 0, this.illuminanceMax);
                        this.viewer.model.setNodesFaceColor([_device.instanceId], Communicator.Color.createFromFloat(color[0], color[1], color[2]));
                    }

                    if (undefined != _device.barometerId) {
                        if (undefined == _device.currentEnv) {
                            this.viewer.model.unsetNodesFaceColor ([_device.barometerId]);
                            _device.currentEnv = {
                                temperature: undefined,
                                humidity: undefined,
                                pressure: undefined
                            }
                        }

                        let promiseArr = [];
                        let updatedNodes = [];

                        // Presser
                        let pres = Math.round(newValue.pressure * 100) / 10;
                        if (_device.currentEnv.pressure != pres) {
                            let angle = 0;
                            if (980 > pres) {
                                angle = -90;
                            } else if (1050 < pres) {
                                angle = 90;
                            } else {
                                angle = 180 / 70 * (pres - 1015);
                            }
                            let rotMatrix = Communicator.Matrix.createFromOffAxisRotation(new Communicator.Point3(0, -1, 0), angle);
                            promiseArr.push(this.viewer.model.setNodeMatrix(_device.indexNodes[0], rotMatrix));
                            updatedNodes.push(_device.indexNodes[0]);
                            _device.currentEnv.pressure = pres;
                        }
                        
                        // Humidity
                        let humi = Math.round(newValue.humidity * 10) / 10;
                        if (_device.currentEnv.humidity != humi) {
                            let angle = 300 / 100 * (newValue.humidity - 50);
                            let rotMatrix = Communicator.Matrix.createFromOffAxisRotation(new Communicator.Point3(0, -1, 0), angle);

                            let multiMatrix = Communicator.Matrix.multiply(rotMatrix, this.barometerIndexMatrixes[0]);
                            promiseArr.push(this.viewer.model.setNodeMatrix(_device.indexNodes[1], multiMatrix));
                            updatedNodes.push(_device.indexNodes[1]);
                            _device.currentEnv.humidity = humi;
                        }

                        // Temperature
                        let temp = Math.round(newValue.temperature * 10) / 10;
                        if (_device.currentEnv.temperature != temp) {
                            let angle = 300 / 90 * (newValue.temperature - 15);
                            let rotMatrix = Communicator.Matrix.createFromOffAxisRotation(new Communicator.Point3(0, -1, 0), angle);
                            let multiMatrix = Communicator.Matrix.multiply(rotMatrix, this.barometerIndexMatrixes[1]);
                            promiseArr.push(this.viewer.model.setNodeMatrix(_device.indexNodes[2], multiMatrix));
                            updatedNodes.push(_device.indexNodes[2]);
                            _device.currentEnv.temperature = temp;
                        }

                        if (0 < promiseArr.length) {
                            Promise.all(promiseArr).then(() => {
                                this.viewer.model.setNodesHighlighted(updatedNodes, true);
                                setTimeout(() => {
                                    this.viewer.model.setNodesHighlighted(updatedNodes, false);
                                }, 2000);
                            });
                        };
                    }            
                },
            );    

            this.$store.watch(
                (state, getters) => getters.alarm,
                (newValue, oldValue) => {
                    if( newValue != null) {
                        this.markup.get(newValue.id)._textBox.getBoxPortion().setFillColor(new Communicator.Color(255, 0, 0));
                    } else {
                        this.markup.get(oldValue.id)._textBox.getBoxPortion().setFillColor(new Communicator.Color(255, 255, 255));
                    }
                },
            );

            // Create object for label
            for (let i = 0; i < Math.ceil(this.illuminanceMax / 100) + 1; i++) {
                this.illumItems.push({
                    id: i,
                    label: String(i * 100),
                    left: '-100px',
                    top: '-100px'}
                );
            }    
        },
        computed: {
            devices() {
                return this.$store.state.devices;
            },
            activeDevice() {
                return this.$store.state.activeDevice;
            },
            floorMapOperator() {
                return this.$store.state.floorMapOperator;
            },
            cameraChangedFromDraw() {
                return this.$store.state.cameraChangedFromDraw;
            },
            walkMode() {
                return this.$store.state.walkMode;
            },
            illuminanceMax() {
                return this.$store.state.illuminanceMax
            }
        },
        data() {
            return {
                markup: new Map(),
                markup_uids: new Map(),
                sceneReady: false,
                pendingDevices: [],
                viewer: null,
                customWalkOpHandle: undefined,
                lastCamera: undefined,
                chartMeshes: {},
                lastMkuVisibility: true,
                currentChart: "24h",
                loadingImageIds: [],
                illumTitle: {top: "-100px", left: "-10px"},
                illumItems: [],
                barometerIndexMatrixes: []
            };
        },
        mounted: function() {
            this.viewer = new Communicator.WebViewer({
                containerId: "viewer-div",
                streamingMode: 1,
                endpointUri: "./models/techsoft3D_Building2020.scs",
                //endpointUri: "./models/RW2-A2-1.scs",                
            });

            var _this = this;
            this.viewer.setCallbacks({

                sceneReady: function() {
                    let camera = new Communicator.Camera.construct(JSON.parse(_this.$store.state.defaultCamera));
                    _this.viewer.view.setCamera(camera);

                    _this.viewer.view.setAmbientLightColor(new Communicator.Color(128, 128, 128));
                    _this.viewer.view.setAmbientOcclusionRadius(.02);
                    _this.viewer.view.setAmbientOcclusionEnabled(true);
                    _this._layoutLabel();

                    _this.loadImage("./src/assets/loading.png").then((imageIds) => {
                        _this.loadingImageIds = imageIds;

                        let colorContour = new ColorContour(_this.viewer);
                        colorContour.create(25, 400);

                        /*Array.from(_this.devices).forEach(device => {
                            _this.addDevice(device);
                        })*/
                        _this.sceneReady = true;
                        _this.pendingDevices.forEach( device => _this.addDevice(device) );

                        // Start chart updating timmer
                        _this.setAutoChartUpdate(15000);
                    });

                },
                selectionArray: function(selections) {
                    for (var _i = 0, selections_1 = selections; _i < selections_1.length; _i++) {
                        var selection = selections_1[_i];

                        Array.from(_this.devices).forEach( function(device, index) {

                            if(device.instanceId == selection._selection._nodeId) {
                                _this.$store.commit('setActiveDevice', index);
                                return;
                            }

                        })          
                    }
                },
                camera: (camera) => {
                    if (!this.cameraChangedFromDraw && this.walkMode) {
                        let position = camera.getPosition();
                        let target = camera.getTarget();

                        // compute view direction
                        let cameraDir = target.subtract(position);
                        cameraDir.normalize();
                        let angleDeg = this.vectorToXYPlaneAngleDeg(cameraDir);

                        // create camera markups
                        if (null != this.floorMapOperator) {
                            this.floorMapOperator.createUpdateCameraMarkups(position, angleDeg);
                        }
                    }
                }

            });

            let customWalkOp = new CustomWalkOperator(this.viewer);
            this.customWalkOpHandle = this.viewer.registerCustomOperator(customWalkOp);

            this.viewer.start();

            window.onresize = function (event) {
                if (typeof event.target.getAttribute === 'function') {
                    return;
                }
                else {
                    _this.viewer.resizeCanvas();
                    _this._layoutLabel();
                }
            };

        },
        methods: {
            _createSpehereMeshData(location) {
                let d = 5;
                let r = 500;

                let vertexData = [];

                for (let ph=-90;ph<90;ph+=d) {
                    for (let th=0;th<=360;th+=d)
                    {
                        vertexData.push(location[0] + r*this.Sin(th)*this.Cos(ph))
                        vertexData.push(location[1] + r*this.Sin(ph))
                        vertexData.push(location[2] + r*this.Cos(th)*this.Cos(ph));
                                                
                        vertexData.push(location[0] + r*this.Sin(th)*this.Cos(ph+d))
                        vertexData.push(location[1] + r*this.Sin(ph+d))
                        vertexData.push(location[2] + r*this.Cos(th)*this.Cos(ph+d)); 

                        vertexData.push(location[0] + r*this.Sin(th+d)*this.Cos(ph))
                        vertexData.push(location[1] + r*this.Sin(ph))
                        vertexData.push(location[2] + r*this.Cos(th+d)*this.Cos(ph));

                        vertexData.push(location[0] + r*this.Sin(th)*this.Cos(ph+d))
                        vertexData.push(location[1] + r*this.Sin(ph+d))
                        vertexData.push(location[2] + r*this.Cos(th)*this.Cos(ph+d)); 
                                                
                        vertexData.push(location[0] + r*this.Sin(th+d)*this.Cos(ph+d))
                        vertexData.push(location[1] + r*this.Sin(ph+d))
                        vertexData.push(location[2] + r*this.Cos(th+d)*this.Cos(ph+d));

                        vertexData.push(location[0] + r*this.Sin(th+d)*this.Cos(ph))
                        vertexData.push(location[1] + r*this.Sin(ph))
                        vertexData.push(location[2] + r*this.Cos(th+d)*this.Cos(ph));                                                 
                    }
                }

                const meshData = new Communicator.MeshData();
                meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);
                meshData.setBackfacesEnabled(true);
                meshData.addFaces(vertexData);
                return meshData;
            },

            Sin(degrees) {
                return Math.sin((degrees)*3.1415927/180)
            },

            Cos(degrees) {
                return Math.cos((degrees)*3.1415927/180)
            },

            createNote(device) {
                return "Device " + device.Sensor +
                    "\nTemperature: " + device.temperature + "\n" +
                    "\nHumidity: " + device.humidity + "\n" +
                    "\nIlluminance: " + device.illuminance + "\n" +
                    "\nPressure: " + device.pressure + "\n";
            },

            addDevice(device) {                
                return new Promise((resolve, reject) => {
                    let meshData = this._createSpehereMeshData(device.location);;//Communicator.Util.generateSphereMeshData(); // TODO, why can't I select sphere when translated?

                    var _this = this;
                    var _device = device;

                    this.viewer.getModel().createMesh(meshData).then(function (meshId) {
                    
                        let meshInstanceData = new Communicator.MeshInstanceData(meshId);
                            meshInstanceData.setFaceColor(new Communicator.Color(128, 128, 128));
                            _this.viewer.getModel().createMeshInstance(meshInstanceData).then((instanceId) => {
                                device.instanceId = instanceId;

                                // Create Chart mesh
                                if (undefined != device.chartArea) {
                                    let chartMesh = new ChartMesh(_this.viewer, device.id, device.chartArea, device.TD, device.title, _this.loadingImageIds);
                                    chartMesh.createChartMeshes(_this.currentChart).then((response) => {
                                        if ('OK' == response) {
                                            _this.chartMeshes[device.id] = chartMesh;
                                        }
                                        // Load barometer
                                        _this.loadbarometerInstance(device).then(() => {
                                            resolve();
                                        });
                                    }).catch((err) => {
                                        reject();
                                    });
                                }
                            });

                        /*let m = new Communicator.Matrix();
                        m.scale(500);
                        m.setTranslationComponent( _device.location[0], _device.location[1], _device.location[2] );
                        meshInstanceData.setMatrix(m);*/
        
                        meshInstanceData.setFaceColor(Communicator.Color.blue());

                        var __device = _device;
                        _this.viewer.getModel().createMeshInstance(meshInstanceData).then(function (instanceId) {
                            __device.instanceId = instanceId;
                        });

                        var text = _this.createNote(_device.sensorData);
                        var loc = new Communicator.Point3(_device.location[0], _device.location[1], _device.location[2] +500);

                        var markup = new CustomMarkupItem(_this.viewer, -5, text, loc,
                            new Communicator.Point3(0,0,1), 
                            500);
                        
                        markup.Sensor = _device.id;

                        var uid = _this.viewer.markupManager.registerMarkup(markup);
                        
                        _this.markup.set(_device.id, markup);
                        _this.markup_uids.set(_device.id, uid);
                    });        
                });      
            },
            loadImage (filename) {
                return new Promise((resolve, reject) => {
                    var request = new XMLHttpRequest();
                    request.open("GET", filename, true);
                    request.responseType = "arraybuffer";
                    request.onload = () => {
                        if (request.readyState === 4) {
                            if (request.status === 200) {
                                var imageOptions = {
                                    format: Communicator.ImageFormat.Png,
                                    data: new Uint8Array(request.response),
                                };
                                this.viewer.model.createImage(imageOptions).then((imageId) => {
                                    resolve(imageId);
                                });
                            }
                        }
                    };
                    request.onerror = (event) => {
                        reject(event);
                    };
                    request.send();
                });
            },
            setAutoChartUpdate (interval) {
                // Updating charts
                var id = setInterval(() => {
                    if ("24h" == this.currentChart) {
                        this.currentChart = "60m";
                    } else {
                        this.currentChart = "24h";
                    }

                    let promiseArr = [];
                    for (let key in this.chartMeshes) {
                        promiseArr.push(this.chartMeshes[key].createChartMeshes(this.currentChart));
                    }
                    Promise.all(promiseArr);
                }, interval);
            },
            vectorToXYPlaneAngleRad(point2d) {
                // compute angle
                let angleRad = Math.atan(point2d.y / point2d.x);

                // consider over PI / 2 (-PI ~ PI)
                if (0 > point2d.x) {
                    if (0 <= point2d.y) {
                        angleRad += Math.PI;
                    } else {
                        angleRad -= Math.PI;
                    }
                }

                return angleRad;
            },
            vectorToXYPlaneAngleDeg(point2d) {
                let angleRad = this.vectorToXYPlaneAngleRad(point2d);
                let angleDeg = angleRad / Math.PI * 180;
                return angleDeg;
            },
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
            _layoutLabel() {
                let offset = $("#viewer-div").offset();
                let width = $("#viewer-div").width();
                let height = $("#viewer-div").height();

                this.illumTitle.left = String(offset.left + width - 120) + "px";
                this.illumTitle.top = String(offset.top + (height - 400) / 2 - 30) + "px";

                for (var i = 0; i < this.illumItems.length; i++) {
                    this.illumItems[i].left = String(offset.left + width -40) + "px";
                    this.illumItems[i].top = String(offset.top + (height - 400) / 2 + 390 - (400 / (this.illumItems.length - 1)) * i) + "px";
                }
            },
            findChildNodeId(node, model, nodeName, nodes) {
                let modelNodeName = model.getNodeName(node);
                if (0 == modelNodeName.indexOf(nodeName)) {
                    nodes.push(node);
                    return;
                } else {
                    var children = model.getNodeChildren(node);
                    if (!children) {
                        return;
                    }
                    for (let child of children) {
                        this.findChildNodeId(child, model, nodeName, nodes);
                    }
                }
            },
            loadbarometerInstance(device) {
                return new Promise((resolve, reject) => {
                    let root = this.viewer.model.getAbsoluteRootNode()
                    this.viewer.model.loadSubtreeFromScsFile(root, "./models/barometer01_assy.scs").then((nodeIds) => {
                        // Location
                        let scale = 4;
                        let scaleMatrix = new Communicator.Matrix().scale(scale);
                        let rotMatrix1 = new Communicator.Matrix.createFromOffAxisRotation(new Communicator.Point3(0, 1, 0), 180);
                        let multiMatrix = Communicator.Matrix.multiply(scaleMatrix, rotMatrix1);
                        let rotMatrix2 = new Communicator.Matrix.createFromOffAxisRotation(new Communicator.Point3(0, 0, 1), device.barometerPosition.a);
                        multiMatrix = Communicator.Matrix.multiply(multiMatrix, rotMatrix2);
                        let OffMatrix = new Communicator.Matrix().setTranslationComponent(device.barometerPosition.x/scale, device.barometerPosition.y/scale, device.barometerPosition.z/scale);
                        device.barometerMatrix = Communicator.Matrix.multiply(multiMatrix, OffMatrix);
                        this.viewer.model.setNodeMatrix(nodeIds[0], device.barometerMatrix).then(() => {
                            // find index node ids
                            let nodes = [];
                            this.findChildNodeId(nodeIds[0], this.viewer.model, "longIndex-1", nodes);
                            this.findChildNodeId(nodeIds[0], this.viewer.model, "smallIndex-", nodes);
                            device.indexNodes = nodes;

                            if (3 == nodes.length && 0 == this.barometerIndexMatrixes.length) {
                                {
                                    let matrix = this.viewer.model.getNodeMatrix(nodes[1]);
                                    let rotatCenter = Communicator.Point3.zero();
                                    matrix.transform(rotatCenter, rotatCenter);
                                    this.barometerIndexMatrixes.push(new Communicator.Matrix().setTranslationComponent(rotatCenter.x, rotatCenter.y, rotatCenter.z));
                                }
                                {
                                    let matrix = this.viewer.model.getNodeMatrix(nodes[2]);
                                    let rotatCenter = Communicator.Point3.zero();
                                    matrix.transform(rotatCenter, rotatCenter);
                                    this.barometerIndexMatrixes.push(new Communicator.Matrix().setTranslationComponent(rotatCenter.x, rotatCenter.y, rotatCenter.z));
                                }
                            }

                            device.barometerId = nodeIds[0];
                            this.viewer.model.setNodesFaceColor(nodeIds, new Communicator.Color(128, 128, 128));
                            resolve();
                        })
                    });

                });
            }
        },       
    }
</script>

<style scoped>
.colorTitle,
.colorLabel {
    position: absolute;
    color: #000;
    font-weight: bold;
} 
</style>