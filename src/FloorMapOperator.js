export default class FloorMapOperator extends Communicator.Operator.Operator {
    constructor(viewer, owner) {
        super();
        this._viewer = viewer;
        this._owner = owner;
        this._markupItemPos;
        this._markupItemDir
        this._activeMarkup = null;
    }

    _onStart(event) {
        let screenPoint = event.getPosition();
        let drawingPoint = this._getCursorPointOnDrawing(screenPoint);

        this._activeMarkup = this._selectMarkup(screenPoint);

        if (null != this._activeMarkup) {
            this._owner.$store.commit('setCameraChangedFromDraw', true);

            let className = this._activeMarkup.getClassName();
            switch (className) {
                // rotate camera
                case "cameraMarkupDir": {
                    this._rotateCamera(screenPoint);
                }
                break;
            }

        }
    }

    onMouseDown(event) {
        this._onStart(event);

        // let camera = this._viewer.view.getCamera();
        // let json = camera.forJson();
        // let str = JSON.stringify(json);
    }

    onTouchStart(event) {
        this._onStart(event);
    }

    _onMove(event) {
        let screenPoint = event.getPosition();

        let drawingPoint = this._getCursorPointOnDrawing(screenPoint);

        if (null != this._activeMarkup) {
            if ("cameraMarkupPos" == this._activeMarkup.getClassName()) {
                if (undefined != drawingPoint) {
                    this._owner.$store.commit('setCameraPoint', drawingPoint);

                    this._markupItemPos.setPosition(drawingPoint);
                    this._markupItemDir.setPosition(drawingPoint);

                    this._viewer.markupManager.refreshMarkup();
                }
            } else if ("cameraMarkupDir" == this._activeMarkup.getClassName()) {
                this._rotateCamera(screenPoint);
            }

            event.setHandled(true);
        } else {
            let markup = this._selectMarkup(screenPoint);
            if (null != markup) {
                let name = markup.getClassName();
                if ("cameraMarkupPos" == name || "cameraMarkupDir" == name) {
                    this._owner.$store.commit('setActiveMarkupId', -1);
                }
                else if ("statusMarkup" == name) {
                    let id = markup.getDeviceId();
                    this._owner.$store.commit('setActiveMarkupId', id);
                }   
            } else {
                this._owner.$store.commit('setActiveMarkupId', -1);
            }
        }
    }

    _rotateCamera(screenPoint) {
        let angle = this._activeMarkup.getAngle();

        let centerDraw = this._activeMarkup.getCenterPoint();
        let centerScreen = this._viewer.view.projectPoint(centerDraw);

        let vector = new Communicator.Point3(screenPoint.x, screenPoint.y, 0);
        vector.subtract(centerScreen);

        // consider screen is upside down 
        vector.y *= -1;

        // compute angle
        let newAngle = vectorToXYPlaneAngleDeg(vector);

        this._owner.$store.commit('setCameraAngle', newAngle - angle);

        this._markupItemDir.setAngle(newAngle);

        this._viewer.markupManager.refreshMarkup();
    }

    onMouseMove(event) {
        this._onMove(event);
    }

    onTouchMove(event) {
        this._onMove(event);
    }

    _onEnd(event) {
        this._activeMarkup = null;
        this._owner.$store.commit('setCameraChangedFromDraw', false);
    }

    onMouseUp(event) {
        this._onEnd(event);
    }

    onTouchEnd(event) {
        this._onEnd(event);
    }

    _getCursorPointOnDrawing(screenPoint) {
        let anchor = Communicator.Point3.zero();
        let normal = new Communicator.Point3(0, 0, 1);
        let anchorPlane = Communicator.Plane.createFromPointAndNormal(anchor, normal);
        let raycast = this._viewer.getView().raycastFromPoint(screenPoint);
        let intersectionPoint = Communicator.Point3.zero();
        
        if (anchorPlane.intersectsRay(raycast, intersectionPoint)) {
            return intersectionPoint;
        } else {
            return undefined;
        }
    }

    createUpdateCameraMarkups(drawingPoint, angle, isShared) {
        if (undefined == drawingPoint) {
            drawingPoint = this._markupItemDir.getCenterPoint();
            angle = this._markupItemDir.getAngle();
        }

        let markupItemPos = this._markupItemPos;
        let markupItemDir = this._markupItemDir;

        if (undefined == markupItemPos) {
            this._createCameraPosMarkup(drawingPoint);
        } else {
            markupItemPos.setPosition(drawingPoint);
        }

        if (undefined == markupItemDir) {
            this._createCameraDirMarkup(drawingPoint, angle);
        } else {
            markupItemDir.setPosition(drawingPoint);
            markupItemDir.setAngle(angle);
        }

        this._viewer.markupManager.refreshMarkup();
    }

    _createCameraPosMarkup(drawingPoint) {
        // create markup pos
        let r = 10;
        let markupItem = new cameraMarkupPos(this._viewer, drawingPoint, r);
        this._viewer.markupManager.registerMarkup(markupItem);

        this._markupItemPos = markupItem;
    }

    _createCameraDirMarkup(drawingPoint, angle) {
        // create markup dir
        let r = 35;
        let markupItem = new cameraMarkupDir(this._viewer, drawingPoint, angle, r);
        this._viewer.markupManager.registerMarkup(markupItem);

        this._markupItemDir = markupItem;
    }

    _selectMarkup(screenPoint) {
        let markup = this._viewer.markupManager.pickMarkupItem(screenPoint);
        return markup;
    }


}

class cameraMarkupPos {
    constructor(viewer, drawingPoint, r) {
        this._viewer = viewer;

        this._drawingPoint = drawingPoint.copy();
        this._circle = new Communicator.Markup.Shape.Circle();

        this._circle.setStrokeColor(new Communicator.Color(255, 255, 0));
        this._circle.setFillOpacity(1);
        this._circle.setStrokeWidth(1);
        this._circle.setFillColor(new Communicator.Color(255, 255, 0));

        this._r = r;
        this._isActive = true;
    }

    draw () {
        this._circle.set(this._viewer.view.projectPoint(this._drawingPoint), this._r);
        this._viewer.markupManager.getRenderer().drawCircle(this._circle);
    }

    hit(point) {
        let projPoint = this._viewer.view.projectPoint(this._drawingPoint);
        let dist = Communicator.Point2.distance(projPoint, point);
        if (this._r >= dist && this._isActive) {
            return true;
        }
        return false;
    }

    getClassName() {
        return "cameraMarkupPos";
    }

    setPosition(drawingPoint) {
        this._drawingPoint.assign(drawingPoint);
    }

    setActive(isActive) {
        this._isActive = isActive;
        if (this._isActive) {
            let color = new Communicator.Color(255, 255, 0);
            this._circle.setStrokeColor(color);
            this._circle.setFillColor(color);
        }
        else {
            let color = new Communicator.Color(128, 128, 128);
            this._circle.setStrokeColor(color);
            this._circle.setFillColor(color);
        }
    }
};

class cameraMarkupDir {
    constructor(viewer, drawingPoint, angle, r) {
        this._viewer = viewer;
        this._drawingPoint = drawingPoint.copy();
        this._angle = angle;
        this._polygon = new Communicator.Markup.Shape.Polygon();

        this._polygon.setStrokeColor(new Communicator.Color(255, 255, 0));
        this._polygon.setStrokeWidth(1);
        this._polygon.setFillOpacity(0.5);
        this._polygon.setFillColor(new Communicator.Color(255, 255, 0));

        let rad = Math.PI / 9;
        this._r = r;
        this._isActive = true;

        let openAngle = Math.PI / 180 * 45;
        let splitCnt = 3;
        let pitchAngle = openAngle / splitCnt;
        this._points = [];
        for (let i = 0; i <= splitCnt; i++) {
            let rad = pitchAngle * i - openAngle / 2;
            this._points.push( new Communicator.Point3(this._r * Math.cos(rad), this._r * Math.sin(rad), 0) );
        }
    }

    draw () {
        let screenPoint = this._viewer.view.projectPoint(this._drawingPoint);

        // rotate matrix
        let vZ = new Communicator.Point3(0, 0, 1);
        let matrixR = new Communicator.Matrix.createFromOffAxisRotation(vZ, this._angle);
    
        // add points to polygon
        this._polygon.clearPoints();
        this._polygon.pushPoint(screenPoint);

        for (let i = 0; i < this._points.length; i++) {
            let point3d = Communicator.Point3.zero();
            matrixR.transform(this._points[i], point3d);

            let point2d = Communicator.Point2.fromPoint3(point3d);

            point2d.y *= -1;    // consider screen is upside down

            point2d.add(screenPoint);

            this._polygon.pushPoint(point2d);
        }

        this._polygon.pushPoint(screenPoint);

        this._viewer.markupManager.getRenderer().drawPolygon(this._polygon);
    }

    hit(point) {
        let projPoint = this._viewer.view.projectPoint(this._drawingPoint);
        let dist = Communicator.Point2.distance(projPoint, point);
        if (10 < dist && this._r >= dist && this._isActive) {
            return true;
        }

        return false;
    }

    getClassName() {
        return "cameraMarkupDir";
    }

    getCenterPoint() {
        return this._drawingPoint;
    }

    getAngle() {
        return this._angle;
    }

    setPosition(drawingPoint) {
        this._drawingPoint.assign(drawingPoint);
    }

    setAngle(angle) {
        this._angle = angle;
    }

    setActive(isActive) {
        this._isActive = isActive;

        if (this._isActive) {
            let color = new Communicator.Color(255, 255, 0);
            this._polygon.setStrokeColor(color);
            this._polygon.setFillColor(color);
        }
        else {
            let color = new Communicator.Color(128, 128, 128);
            this._polygon.setStrokeColor(color);
            this._polygon.setFillColor(color);
        }
    }
}

function vectorToXYPlaneAngleRad(point2d) {
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
}

function vectorToXYPlaneAngleDeg(point2d) {
    let angleRad = vectorToXYPlaneAngleRad(point2d);
    let angleDeg = angleRad / Math.PI * 180;
    return angleDeg;
}