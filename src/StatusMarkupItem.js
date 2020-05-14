export default class StatusMarkupItem {
    constructor(viewer, drawingPoint, offsetX, offsetY, deviceId) {
        this._viewer = viewer;
        this._drawingPoint = drawingPoint.copy();
        this._offsetX = 0;
        this._offsetY = 0;
        this._deviceId = deviceId;
        if (undefined != this._offsetX) {
            this._offsetX = offsetX;
        }
        if (undefined != this._offsetY) {
            this._offsetY = offsetY;
        }        
        this._size = 6;
        this._counter = 0;

        this._RE = new Communicator.Markup.Shape.Rectangle();
        this._RE.setStrokeColor(new Communicator.Color(128, 128, 128));
        this._RE.setFillColor(new Communicator.Color(128, 128, 128));
        this._RE.setSize(new Communicator.Point2(this._size, this._size));
    }

    draw () {
        let pnt = new Communicator.Point2.fromPoint3(this._viewer.view.projectPoint(this._drawingPoint));
        if (undefined != this._offsetX && undefined != this._offsetY) {
            pnt.x += this._offsetX - this._size / 2;
            pnt.y += this._offsetY - this._size / 2;
        }
        this._RE.setPosition(pnt);
        this._viewer.markupManager.getRenderer().drawRectangle(this._RE);
    }

    hit(point) {
        let projPoint = this._viewer.view.projectPoint(this._drawingPoint);
        let dist = Communicator.Point2.distance(projPoint, point);
        if (8 >= dist) {
            return true;
        }
        return false;
    }

    getClassName() {
        return "statusMarkup";
    }

    getDeviceId() {
        return this._deviceId;
    }

    setColor(color) {
        let currentColor = this._RE.getStrokeColor();

        if (currentColor.r == color.r && currentColor.g == color.g && currentColor.b == color.b) {
            return false;
        }

        this._RE.setStrokeColor(color);
        this._RE.setFillColor(color);

        return true;
    }

    blinkMarkup() {
        let id = setInterval(() => {
            let r = (this._counter++) % 2;
            let pnt = this._RE.getPosition();
            if (0 == r) {
                this._size = 8;
            } else if (1 == r) {
                this._size = 6;
            }

            this._RE.setSize(new Communicator.Point2(this._size, this._size));
            this._viewer.markupManager.getRenderer().drawRectangle(this._RE);            
            this._viewer.markupManager.refreshMarkup();

            if (3 < this._counter) {
                this._counter = 0;
                clearInterval(id);
            }
        }, 250);
    }
}