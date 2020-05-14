export default class ChartMesh {
    constructor(viewer, deviceId, chartArea, TD, title, loadingImageIds) {
        this._viewer = viewer;
        this._deviceId = deviceId;
        this._chartAreaPosition = chartArea.position;
        this._chartAreaSize = chartArea.size;
        this._loadingImageIds = loadingImageIds;
        this._TD = TD;
        this._title = title;
        this._historyType;
        this._titleCanvasId;
        this._chartCanvasIds = [];
        this._tempHumiChart;
        this._presChart;
        this._illuChart;
        this._meshIds = [];
        this._meshInstanceIds = [];
        this._imageIds24h = [];
        this._imageIds60m = [];
        this._imageIdTitle;
        this._lastHours = -1;
        this._lastMinutes = -1;
        this._serverTD = -8;
    }

    createChartMeshes(type) {
        return new Promise((resolve, reject) => {
            this._historyType = type;

            // Step 0
            this._initialize().then(() => {
                // Step 1
                this._getEnvHistory().then((envData) => {
                    if ('no_time_difference' == envData) {
                        if (("24h" == this._historyType && 0 == this._imageIds24h.length) ||
                            ("60m" == this._historyType && 0 == this._imageIds60m.length)) {
                                return resolve();
                        }
                        // show existing images
                        setTimeout(() => {
                            this._setAllChartTextures();
                            resolve();
                        }, 1000);
                    } else if (envData.length) {
                        // Setp 2
                        this._deleteAllImages().then(() => {
                            // Step 3
                            this._createAllCharts(envData).then(() => {
                                // Step 4
                                this._createAllMeshes().then(() => {
                                    // Step 5
                                    this._createAllChartImages().then(() => {
                                        // Step 6
                                        this._setAllChartTextures();
                                        resolve('OK');
                                    }).catch((error) => {});
                                }).catch((error) => {});
                            }).catch((error) => {});
                        });
                    } else {
                        console.log("Env history data is empty, device_id: " + this._deviceId + ", type: " + this._historyType);
                        resolve("noEnvData");
                    }
                }).catch((err) => {
                    reject("error: createChartMeshes");
                });
            });
        });
    }

    _initialize() {
        return new Promise((resolve, reject) => {
            if (0 == this._meshInstanceIds.length) {
                resolve();
            } else {
                // Updating processes for 2nd time
                // remove existing charts
                if (undefined != this._tempHumiChart) {
                    this._tempHumiChart.destroy();
                    this._tempHumiChart = undefined;
                }
                if (undefined != this._presChart) {
                    this._presChart.destroy();
                    this._presChart = undefined;
                }
                if (undefined != this._presChart) {
                    this._presChart.destroy();
                    this._presChart = undefined;
                }

                // Show loading image
                for (let i = 0; i < 3; i++) {
                    this._viewer.model.setNodesTexture([this._meshInstanceIds[i][0]], {
                        imageId: this._loadingImageIds,
                        modifiers: Communicator.TextureModifier.Decal
                    });
                }
                resolve();
            }
        });
    }

    _formatDate(dt) {
        let y = dt.getFullYear();
        let m = ('00' + (dt.getMonth() + 1)).slice(-2);
        let d = ('00' + dt.getDate()).slice(-2);
        let h = ('00' + dt.getHours()).slice(-2);
        let mi = ('00' + dt.getMinutes()).slice(-2);
        let s = ('00' + dt.getSeconds()).slice(-2);
        return y + '-' + m + '-' + d + 'T' + h + ':' + mi + ':' + s;
    }

    _requestEnvHistoryForServer(from, to, timeLavel) {
        return new Promise((resolve, reject) => {
            // Request historical data for Server
            let time = '?from=' + from + '-0800&to=' + to + '-0800';
            var request = new XMLHttpRequest();
            request.open('GET', 'http://iotcommunicator-alb-176802839.us-west-2.elb.amazonaws.com/devices/' + this._deviceId + time);
            request.onload = () => {
                if (request.readyState === 4) {
                    if (request.status === 200) {
                        var response = request.responseText;
                        var envData = JSON.parse(response);
                        if ("24h" == this._historyType) {
                            let temperature = 0;
                            let humidity = 0;
                            let pressure = 0;
                            let illuminance = 0;

                            // Compute average values for 5 min
                            if (envData.length) {
                                for (let data of envData) {
                                    temperature += Number(data.metrics.M.temperature.N);
                                    humidity += Number(data.metrics.M.humidity.N);
                                    pressure += Number(data.metrics.M.pressure.N);
                                    illuminance += Number(data.metrics.M.illuminance.N);
                                }
                                let cnt = envData.length;
                                temperature /= cnt;
                                humidity /= cnt;
                                pressure /= cnt;
                                illuminance /= cnt;
                            }
                            resolve({
                                label: timeLavel, temperature: temperature, humidity: humidity, pressure, pressure, illuminance: illuminance
                            });
                        } else if ("60m" == this._historyType) {
                            let envHistory = [];
                            let currentM;
                            let cnt = 0;
                            let temperature = 0;
                            let humidity = 0;
                            let pressure = 0;
                            let illuminance = 0;
                            for (let data of envData) {
                                let dt = new Date(Number(data.metric_time.S));
                                let m = dt.getMinutes();
                                if (undefined == currentM) {
                                    currentM = m;
                                }

                                if (currentM == m) {
                                    cnt++;
                                    temperature += Number(data.metrics.M.temperature.N);
                                    humidity += Number(data.metrics.M.humidity.N);
                                    pressure += Number(data.metrics.M.pressure.N);
                                    illuminance += Number(data.metrics.M.illuminance.N);
                                } else {
                                    temperature /= cnt;
                                    humidity /= cnt;
                                    pressure /= cnt;
                                    illuminance /= cnt;

                                    envHistory.push({label: currentM, temperature: temperature, humidity: humidity, pressure, pressure, illuminance: illuminance});

                                    cnt = 0;
                                    temperature = 0;
                                    humidity = 0;
                                    pressure = 0;
                                    illuminance = 0;
                                    currentM = m;
                                }
                            }
                            resolve(envHistory);
                        } else {
                            reject("error: chart type is unmatched");
                        }
                    }
                }
            };
            request.onerror = () => {
                reject("error: XMLHttpRequest response error");
            };
            request.send();
        });
    }

    _getEnvHistory() {
        return new Promise((resolve, reject) => {
            // Get current time in UTC
            let utc = new Date();
            const offset = utc.getTimezoneOffset() * 60 * 1000;
            utc = new Date(utc.getTime() + offset);

            // Get Bend OR time
            const curDate = new Date(utc.getTime() + this._serverTD * 60 * 60 * 1000);

            if ("24h" == this._historyType) {
                // Skip if already created
                let curH = curDate.getHours();
                if (this._lastHours == curH) {
                    return resolve('no_time_difference');
                } else {
                    this._lastHours = curH;
                }

                // Create last 24 hours env history requests  
                let promiseArr = [];
                for (let i = 23; 0 <= i; i--) {
                    // Target o'clock
                    let dtTo = new Date(curDate);
                    dtTo.setHours(dtTo.getHours() - i);
                    dtTo.setMinutes(0);
                    dtTo.setSeconds(0);
                    let to = this._formatDate(dtTo);

                    // 5 min before
                    let dtFrom = new Date(dtTo);
                    dtFrom.setMinutes(dtFrom.getMinutes() - 5);
                    let from = this._formatDate(dtFrom);

                    // query time parameter (ISO8601)
                    dtTo.setHours(dtTo.getHours() - this._serverTD + this._TD);
                    promiseArr.push(this._requestEnvHistoryForServer(from, to, String(dtTo.getHours())));
                }
                Promise.all(promiseArr).then((envData) => {
                    resolve(envData);
                }).catch((err) => {
                    resolve("error: env history request error, device_id: " + this._deviceId);
                });
            } else if ("60m" == this._historyType) {
                // Skip if already created
                let curM = curDate.getMinutes();
                if (this._lastMinutes == curM) {
                    return resolve('no_time_difference');
                } else {
                    this._lastMinutes = curM;
                }

                // Create last 60 minutes env history requests  
                // Target minutes
                let dtTo = new Date(curDate);
                dtTo.setSeconds(0);
                let to = this._formatDate(dtTo);

                // 1 hour before
                let dtFrom = new Date(dtTo);
                dtFrom.setHours(dtFrom.getHours() - 1);
                let from = this._formatDate(dtFrom);

                this._requestEnvHistoryForServer(from, to, String(dtTo.getHours())).then((envData) => {
                    resolve(envData);
                });
            } else {
                reject("error: chart type is unmatched");
            }
        });
    }

    _deleteAllImages() {
        return new Promise((resolve, reject) => {
            // let promiseArr = [];
            // if ("24h" == this._historyType) {
            //     for (let i = 0; i < this._imageIds24h.length; i++) {
            //         promiseArr.push(this._viewer.model.deleteImages(this._imageIds24h[i]));
            //     }
            // } else if ("60m" == this._historyType) {
            //     for (let i = 0; i < this._imageIds60m.length; i++) {
            //         promiseArr.push(this._viewer.model.deleteImages(this._imageIds60m[i]));
            //     }
            // } else {
            //     reject();
            // }

            // Promise.all(promiseArr).then(() => {
                if ("24h" == this._historyType) {
                    this._imageIds24h.length = 0;
                } else if ("60m" == this._historyType) {
                    this._imageIds60m.length = 0;
                }
                resolve();
            // });
        }); 
    }

    _createTempHumChart(canvas, labelArr, humiArr, tempArr, subTitle) {
        let ctx = document.getElementById(canvas);
        if (null == ctx) {
            return;
        }

        this._tempHumiChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelArr,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Humidity',
                        data: humiArr,
                        borderColor: "rgba(254,97,132,0.8)",
                        backgroundColor: "rgba(254,97,132,0.5)",
                        yAxisID: 'y-axis-1'
                    },
                    {
                        type: 'line',
                        label: 'Temperature',
                        data: tempArr,
                        borderColor: "rgba(54,164,235,0.8)",
                        pointBackgroundColor: "rgba(54,164,235,0.8)",
                        fill: false,
                        yAxisID: 'y-axis-2'
                    },
                ],
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Temperature and Humidity' + subTitle,
                    fontSize: 36
                },
                layout: {
                    padding: {
                        left: 20,
                        right: 20,
                        top: 20,
                        bottom: 20
                    }
                },
                scales: {
                yAxes: [{
                    id: 'y-axis-1',
                    position: 'left',
                    ticks: {
                    suggestedMax: 100,
                    suggestedMin: 0,
                    stepSize: 10,
                    fontSize: 24,
                    callback: function(value, index, values){
                        return  value +  '%'
                        }
                    }
                }, {
                    id: 'y-axis-2',
                    position: 'right',
                    ticks: {
                    suggestedMax: 40,
                    suggestedMin: -10,
                    stepSize: 10,
                    fontSize: 24,
                    callback: function(value, index, values){
                        return  value +  ' ℃'
                        }
                    },
                    gridLines: {
                        drawOnChartArea: false, 
                    },
                }],
                xAxes: [{
                    ticks: {
                        fontSize: 24
                    }
                }]
            },
            }
        });
    }

    _createIlluminanceChart(canvas, labelArr, illuArr, subTitle) {
        let ctx = document.getElementById(canvas);
        if (null == ctx) {
            return;
        }

        this._illuChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labelArr,
                datasets: [
                    {
                        label: 'Illuminance',
                        data: illuArr,
                        borderColor: "rgba(254,97,132,0.8)",
                        pointBackgroundColor: "rgba(254,97,132,0.8)",
                    },
                ],
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Illuminance' + subTitle,
                    fontSize: 48
                },
                layout: {
                    padding: {
                        left: 20,
                        right: 20,
                        top: 20,
                        bottom: 20
                    }
                },
                scales: {
                yAxes: [{
                    position: 'left',
                    ticks: {
                    suggestedMax: 0,
                    suggestedMin: 1000,
                    stepSize: 100,
                    fontSize: 36,
                    callback: function(value, index, values){
                        return  value +  ' lx'
                        }
                    }
                }],
                xAxes: [{
                    ticks: {
                        fontSize: 24
                    }
                }]
            },
            }
        });
    }

    _createPressureChart(canvas, labelArr, presArr, subTitle) {
        let ctx = document.getElementById(canvas);
        if (null == ctx) {
            return;
        }

        this._presChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labelArr,
                datasets: [
                    {
                        label: 'Pressure',
                        data: presArr,
                        borderColor: "rgba(54,164,235,0.8)",
                        pointBackgroundColor: "rgba(54,164,235,0.8)",
                    },
                ],
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Pressure' + subTitle,
                    fontSize: 48
                },
                layout: {
                    padding: {
                        left: 20,
                        right: 20,
                        top: 20,
                        bottom: 20
                    }
                },
                scales: {
                yAxes: [{
                    position: 'left',
                    ticks: {
                    suggestedMax: 990,
                    suggestedMin: 1100,
                    stepSize: 5,
                    fontSize: 36,
                    callback: function(value, index, values){
                        return  value +  ' hPa'
                        }
                    }
                }],
                xAxes: [{
                    ticks: {
                        fontSize: 24
                    }
                }]                    },
            }
        });
    }

    _createAllCharts(envData) {
        return new Promise((resolve, reject) => {
            // At 1st time Create canvases for charts (chartCanvas_id_1 ~ 3)
            if (0 == this._chartCanvasIds.length) {
                // Create canvas for title
                {
                    let canvas = document.createElement("canvas");
                    let id = "titleCanvas_" + this._deviceId;
                    this._titleCanvasId = id;
                    canvas.id = id;
                    canvas.class = "titleCanvas";
                    canvas.width = 500;
                    canvas.height = 50;
                    canvas.style.display="none";
                    document.body.appendChild(canvas);

                    let ctx = document.getElementById(id).getContext('2d');
                    ctx.font = "32px serif";
                    ctx.textAlign = "center";
                    ctx.fillText(this._title, 250, 40);
                }

                for (let i = 0; i < 3; i++) {
                    let canvas = document.createElement("canvas");
                    let id = "chartCanvas_" + this._deviceId + "_" + i;
                    this._chartCanvasIds.push(id)
                    canvas.id = id;
                    canvas.class = "chartCanvas";
                    canvas.style.display="none";
                    document.body.appendChild(canvas);
                }
            }

            // Format data arrays for charts
            let labelArr =  new Array(0);
            let tempArr = new Array(0);
            let humiArr = new Array(0);
            let presArr = new Array(0);
            let illuArr = new Array(0);
            for (let i = 0; i <  envData.length; i++) {
                labelArr.push(envData[i].label);
                tempArr.push(Math.round(envData[i].temperature * 10) / 10);
                humiArr.push(Math.round(envData[i].humidity * 10) / 10);
                presArr.push(Math.round(envData[i].pressure * 100) / 10);
                illuArr.push(Math.round(envData[i].illuminance * 10) / 10);
            }

            // Create charts
            let subTitle = "";
            if ("24h" == this._historyType) {
                subTitle = " (Last 24 hours)";
            } else if ("60m" == this._historyType) {
                subTitle = " (Last 60 minutes)";
            }
            this._createTempHumChart(this._chartCanvasIds[0], labelArr, humiArr, tempArr, subTitle);
            this._createIlluminanceChart(this._chartCanvasIds[1], labelArr, illuArr, subTitle);
            this._createPressureChart(this._chartCanvasIds[2], labelArr, presArr, subTitle);

            if (undefined == this._tempHumiChart || undefined == this._presChart || undefined == this._illuChart) {
                return reject("error: charts creation failed")
            }

            // Wait for rendering charts 
            setTimeout(() => {
                resolve();
            }, 500);
        });
    }
    _createPlaneMesh(w, h){
        return new Promise((resolve, reject) => {
            let vertexes = [
                0, 0, 0, 0, 0, h, w, 0, h,
                w, 0, h, w, 0, 0, 0, 0, 0
            ];

            let normals = [
                0, -1, 0, 0, -1, 0, 0, -1, 0,
                0, -1, 0, 0, -1, 0, 0, -1, 0
            ];

            let uvs = [
                0, 0, 0, 1, 1, 1,
                1, 1, 1, 0, 0, 0
            ];

            let meshData = new Communicator.MeshData();
            meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);
            meshData.addFaces(vertexes, normals, null, uvs);

            this._viewer.model.createMesh(meshData).then((meshIds) => {
                resolve(meshIds);
            });
        });
    }

    _createFrameLineMesh(w, h) {
        return new Promise((resolve, reject) => {
            let lineVertices = [ 0, 0, 0, 0, 0, h, w, 0, h, w, 0, 0, 0, 0, 0 ];
            let lineMeshData = new Communicator.MeshData();
            lineMeshData.addPolyline(lineVertices);

            this._viewer.model.createMesh(lineMeshData).then((meshIds) => {
                resolve(meshIds);
            });
        });
    }

    _createRectangleMesh(w, h, offset, angle, name) {
        return new Promise((resolve, reject) => {
            // Create plane mesh and frame line
            let promiseArr = [];
            promiseArr.push(this._createPlaneMesh(w, h));
            promiseArr.push(this._createFrameLineMesh(w, h));
            Promise.all(promiseArr).then((meshIds) => {
                for (let ids of meshIds) {
                    this._meshIds.push(ids);
                }

                if (2 == meshIds.length) {
                    promiseArr.length = 0;

                    // Create plane mesh instance
                    let OffMatrix = new Communicator.Matrix().setTranslationComponent(offset[0], offset[1], offset[2]);
                    let rotMatrix = new Communicator.Matrix.createFromOffAxisRotation(new Communicator.Point3(0, 0, 1), angle);
                    let mulMatrix = Communicator.Matrix.multiply(OffMatrix, rotMatrix);

                    let traMatrix = new Communicator.Matrix().setTranslationComponent(this._chartAreaPosition.x, this._chartAreaPosition.y, this._chartAreaPosition.z);
                    let matrix = Communicator.Matrix.multiply(mulMatrix, traMatrix);

                    let faceColor = new Communicator.Color(255, 255, 255);
                    let meshInstanceData = new Communicator.MeshInstanceData(meshIds[0], matrix, name + "_plane", faceColor);
                    promiseArr.push(this._viewer.model.createMeshInstance(meshInstanceData));
    
                    // Create frame line mesh instance
                    let lineColor = new Communicator.Color(0, 0, 0);
                    let lineMeshInstanceData = new Communicator.MeshInstanceData(meshIds[1], matrix, name + "_frame", undefined, lineColor);
                    promiseArr.push(this._viewer.model.createMeshInstance(lineMeshInstanceData));
                    
                    Promise.all(promiseArr).then((instanceIds) => {
                        resolve (instanceIds);
                    });
                } else {
                    reject("error: create mesh instances failed");
                }
            });
        });
    }

    _createAllMeshes() {
        return new Promise((resolve, reject) => {
            // Skip 2nd time
            if (this._meshInstanceIds.length) {
                return resolve();
            }

            let promiseArr = [];

            // Create mesh computing canvas size
            let w = $('#' + this._chartCanvasIds[0]).width();
            let h = $('#' + this._chartCanvasIds[0]).height();
            let chart1_w = Math.round((this._chartAreaSize.w - 100) * 0.6);
            let chart1_h = this._chartAreaSize.h;
            let chart2_w = this._chartAreaSize.w - 100 - chart1_w;
            let chart2_h = (this._chartAreaSize.h - 100) / 2;
            let titleOffset;

            // Vertical layour (w < h)
            if (this._chartAreaSize.w < this._chartAreaSize.h) {
                chart1_w = this._chartAreaSize.w;
                chart2_w = chart1_w;
                chart1_h = (this._chartAreaSize.h - 200) / 3;
                chart2_h = chart1_h;
            }
            
            if ((chart1_w / chart1_h) < (w / h)) {
                h = chart1_w / w * h;
                let offset = [0, 0, chart1_h - h];

                // Vertical layour (w < h)
                if (this._chartAreaSize.w < this._chartAreaSize.h) {
                    offset = [0, 0, this._chartAreaSize.h - h];
                }

                promiseArr.push(this._createRectangleMesh(chart1_w, h, offset, this._chartAreaPosition.a, this._chartCanvasIds[0]));
                titleOffset = [offset[0], offset[1], offset[2] + h + 20];
            } else {
                w = chart1_h / h * w;
                let offset = [0, 0, 0];

                // Vertical layour (w < h)
                if (this._chartAreaSize.w < this._chartAreaSize.h) {
                    offset = [(this._chartAreaSize.w - w) / 2, 0, this._chartAreaSize.h - chart1_h];
                }

                promiseArr.push(this._createRectangleMesh(w, chart1_h, offset, this._chartAreaPosition.a, this._chartCanvasIds[0]));
                titleOffset = [offset[0], offset[1], offset[2] + chart1_h + 20];
            }

            // For pressure chart
            w = $('#' + this._chartCanvasIds[1]).width();
            h = $('#' + this._chartCanvasIds[1]).height();
            let subTop = 0;
            if ((chart2_w / chart2_h) < (w / h)) {
                h = chart2_w / w * h;
                subTop = this._chartAreaSize.h - h;
                let offset = [chart1_w + 100, 0, subTop];

                // Vertical layour (w < h)
                if (this._chartAreaSize.w < this._chartAreaSize.h) {
                    subTop = this._chartAreaSize.h - chart1_h - 100 - h;
                    offset = [0, 0, subTop];
                }

                promiseArr.push(this._createRectangleMesh(chart2_w, h, offset, this._chartAreaPosition.a, this._chartCanvasIds[1]));
            } else {
                w = chart2_h / h * w;
                subTop = this._chartAreaSize.h - chart2_h;
                let offset = [chart1_w + 100, 0, subTop];

                // Vertical layour (w < h)
                if (this._chartAreaSize.w < this._chartAreaSize.h) {
                    subTop = this._chartAreaSize.h - chart1_h - 100 - chart2_h;
                    offset = [(this._chartAreaSize.w - w) / 2, 0, subTop];
                }

                promiseArr.push(this._createRectangleMesh(w, chart2_h, offset, this._chartAreaPosition.a, this._chartCanvasIds[1]));
            }

            // For illuminance chart
            w = $('#' + this._chartCanvasIds[2]).width();
            h = $('#' + this._chartCanvasIds[2]).height();
            if ((chart2_w / chart2_h) < (w / h)) {
                h = chart2_w / w * h;
                let offset = [chart1_w + 100, 0, subTop - 100 - h];

                // Vertical layour (w < h)
                if (this._chartAreaSize.w < this._chartAreaSize.h) {
                    offset = [0, 0, subTop - 100 - h];
                }

                promiseArr.push(this._createRectangleMesh(chart2_w, h, offset, this._chartAreaPosition.a, this._chartCanvasIds[2]));
            } else {
                w = chart2_h / h * w;
                let offset = [chart1_w + 100, 0, subTop - 100 - chart2_h];

                // Vertical layour (w < h)
                if (this._chartAreaSize.w < this._chartAreaSize.h) {
                    offset = [(this._chartAreaSize.w - w) / 2, 0, subTop - 100 - chart2_h];
                }

                promiseArr.push(this._createRectangleMesh(w, chart2_h, offset, this._chartAreaPosition.a, this._chartCanvasIds[2]));
            }

            // Create mesh for title
            promiseArr.push(this._createRectangleMesh(1500, 150, titleOffset, this._chartAreaPosition.a, this._titleCanvasId));

            Promise.all(promiseArr).then((instanceIds) => {
                this._meshInstanceIds = instanceIds;
                resolve();
            }).catch((err) => {
                reject("error: create all meshes failed");
            });
        });
    }

    _convertDataURIToBinary(dataURI) {
        let BASE64_MARKER = ';base64,';
        let base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
        let base64 = dataURI.substring(base64Index);
        let raw = window.atob(base64);
        let rawLength = raw.length;
        let array = new Uint8Array(new ArrayBuffer(rawLength));
    
        for(let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
        }
        return array;
    }
    
    _createChartImage(chartCanvasId) {
        return new Promise((resolve, reject) => {
            let canvas = document.getElementById(chartCanvasId);
            if (canvas) {
                let img = canvas.toDataURL("image/png");

                let img2 = this._convertDataURIToBinary(img)

                let imageOptions = {
                    format: Communicator.ImageFormat.Png,
                    data: img2,
                };

                this._viewer.model.createImage(imageOptions).then((imageId) => {
                    resolve(imageId);
                });
            } else {
                reject("error: chart canvas not found");
            }
        });
    }

    _createAllChartImages() {
        return new Promise((resolve, reject) => {
            let promiseArr = [];
            for (let i = 0; i < this._chartCanvasIds.length; i++) {
                promiseArr.push(this._createChartImage(this._chartCanvasIds[i]));
            }

            // Create title image
            if (undefined == this._imageIdTitle) {
                promiseArr.push(this._createChartImage(this._titleCanvasId));
            }

            Promise.all(promiseArr).then((imageIds) => {
                if (3 < imageIds.length) {
                    this._imageIdTitle = imageIds.pop();

                    this._viewer.model.setNodesTexture([this._meshInstanceIds[3][0]], {
                        imageId: this._imageIdTitle,
                        modifiers: Communicator.TextureModifier.Decal
                    });
                }

                for (let ids of imageIds) {
                    if ("24h" == this._historyType) {
                        this._imageIds24h.push(ids);
                    } else if ("60m" == this._historyType) {
                        this._imageIds60m.push(ids);
                    }
                }
                resolve();
            }).catch((err) => {
                reject("error: create imeges failed");
            });
        });
    }

    _setAllChartTextures() {
        for (let i = 0; i < this._meshInstanceIds.length - 1; i++) {
            let imageIds;
            if ("24h" == this._historyType) {
                imageIds = this._imageIds24h[i];
            } else if ("60m" == this._historyType) {
                imageIds = this._imageIds60m[i];
            }

            this._viewer.model.setNodesTexture([this._meshInstanceIds[i][0]], {
                imageId: imageIds,
                modifiers: Communicator.TextureModifier.Decal
            });
        }
    }
} 
