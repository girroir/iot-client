// @ts-check
/// <reference path="hoops_web_viewer.d.ts" />
/// <reference path="communicator_server_integration.d.ts" />

var Sample = {
    /** @param {string} name */
    _getParameterByName: function (name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.search);
        if (results === null)
            return null;
        else
            return decodeURIComponent(results[1]);
    },

    _getStreamingMode: function () {
        var streamingMode = Sample._getParameterByName("streamingMode");

        switch (streamingMode) {
            case "interactive":
                return Communicator.StreamingMode.Interactive;

            case "all":
                return Communicator.StreamingMode.All;

            case "ondemand":
                return Communicator.StreamingMode.OnDemand;
        }

        return Communicator.StreamingMode.Interactive;
    },

    _getRenderingLocationString: function () {
        var val = Sample._getParameterByName("viewer");
        return val === "ssr" ? "ssr" : "csr"; 
    },

    _getRendererType: function () {
        var val = Sample._getRenderingLocationString();
        return val === "ssr" ? Communicator.RendererType.Server : Communicator.RendererType.Client;
    },

    _getLayout: function () {
        return Sample._getParameterByName("layout");
    },

    _getModel: function () {
        var modelName = Sample._getParameterByName("instance");
        if (!modelName) {
            modelName = Sample._getParameterByName("model");
        }
        return modelName;
    },

    _getMemoryLimit: function () {
        var memoryLimit = Sample._getParameterByName("memoryLimit");

        if (memoryLimit === null)
            return 0;
        else
            return parseInt(memoryLimit);
    },

    _getProxy: function () {
        var proxy = Sample._getParameterByName("proxy");
        if (proxy === null) {
            return false;
        }
        else {
            return true;
        }
    },

    /** @param {string} endpoint */
    _rewrite: function (endpoint){
        var regex = /([ws]+):\/\/(.*):([0-9]+)/;
        var matches = regex.exec(endpoint);
        if (matches === null) {
            return endpoint;
        }

        var protocol = matches[1];
        var host = matches[2];
        var port = matches[3];

        return protocol + "://" + host + "/" + protocol + "proxy/" + port;
    },

    /** @param {Communicator.WebViewerConfig} config */
    _applyExtraProperties: function (config) {
        var debug = Sample._getParameterByName("debug");
        if (debug !== null && parseInt(debug, 10) !== 0) {
            config._markImplicitNodesOutOfHierarchy = false;
        }
        return config;
    },

    /** @param {string} serviceBrokerUri */
    _createStreamingViewer: function (serviceBrokerUri) {
        var rendererType = Sample._getRendererType();

        var serviceBroker = new Communicator.ServiceBroker(serviceBrokerUri);
        var serviceRequest = new Communicator.ServiceRequest(
            rendererType === Communicator.RendererType.Client ?
                Communicator.ServiceClass.CSR_Session : Communicator.ServiceClass.SSR_Session);

        return serviceBroker.request(serviceRequest).then(function (serviceResponse) {
            if (!serviceResponse.getIsOk()) {
                throw serviceResponse.getReason();
            }
            var serviceProtocol = serviceResponse.getEndpoints().hasOwnProperty(Communicator.ServiceProtocol.WS) ?
                Communicator.ServiceProtocol.WS : Communicator.ServiceProtocol.WSS;
            var clientEndpoint = serviceResponse.getEndpoints()[serviceProtocol];

            if (Sample._getProxy()) {
                clientEndpoint = Sample._rewrite(clientEndpoint);
            }

            /** @type {Communicator.WebViewerConfig} */
            var config = {
                containerId: "viewerContainer",
                endpointUri: clientEndpoint,
                model: Sample._getModel(),
                rendererType: rendererType,
                streamingMode: Sample._getStreamingMode(),
                memoryLimit: Sample._getMemoryLimit()
            };
            Sample._applyExtraProperties(config);
            return new Communicator.WebViewer(config);
        },
        function (serviceResponse) {
            throw "Unable to connect to Service Broker at: " + serviceBrokerUri;
        });
    },

    /** @param {string} scsFile */
    _createScsViewer: function (scsFile) {
        /** @type {Communicator.WebViewerConfig} */
        var config = {
            containerId: "viewerContainer",
            streamingMode: Sample._getStreamingMode(),
        };

        if (scsFile) {
            config.endpointUri = scsFile;
        } else {
            config.empty = true;
        }

        Sample._applyExtraProperties(config);
        var viewer = new Communicator.WebViewer(config);

        return Promise.resolve(viewer);
    },

    _createEmptyViewer: function() {
        return Sample._createScsViewer(null);
    },

    /** @param {string} uri */
    _createLocalServer: function (uri) {
        var renderingLocation = Sample._getRenderingLocationString();
        var fullUri = uri + "?renderingLocation=" + renderingLocation; 

        /** @type {Communicator.WebViewerConfig} */
        var config = {
                containerId: "viewerContainer",
                endpointUri: fullUri,
                model: Sample._getModel(),
                rendererType: Sample._getRendererType(),
                streamingMode: Sample._getStreamingMode(),
                memoryLimit: Sample._getMemoryLimit()
        };
        Sample._applyExtraProperties(config);
        var viewer = new Communicator.WebViewer(config);

        return Promise.resolve(viewer);
    },

    /** @param {string} stylesheetUrl */
    _addStylesheet: function (stylesheetUrl) {
        var link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", stylesheetUrl);
        document.getElementsByTagName('head')[0].appendChild(link);
    },

    screenConfiguration: Communicator.ScreenConfiguration.Desktop,

    _checkforMobile: function(){
        var layout = Sample._getLayout();

        if (layout === "mobile") {
            Sample._addStylesheet("css/Mobile.css");
            Sample.screenConfiguration = Communicator.ScreenConfiguration.Mobile;
        }
        else {
            Sample.screenConfiguration = Communicator.ScreenConfiguration.Desktop;
        }
        
    },

    createViewer: function () {
        Sample._checkforMobile();

        var scsFile = Sample._getParameterByName("scs");
        var scHost = Sample._getParameterByName("scHost");
        var scPort = Sample._getParameterByName("scPort") || "9999";

        if (scsFile) {
            return Sample._createScsViewer(scsFile);
        } else if (!Sample._getModel()) {
            return Sample._createEmptyViewer();
        } else if (scHost) {
            return Sample._createLocalServer("ws://" + scHost + ":" + scPort);
        } else {
            var serviceBrokerEndpoint =
                window.location.protocol + "//" + window.location.hostname + ":11182";
            // TODO: One we switch entirely to the node-server w/proxy,
            // we can just simplify this to do the same as _createLocalServer
            return Sample._createStreamingViewer(serviceBrokerEndpoint);
        }
    }
};