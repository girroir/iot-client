class CustomMarkupOperator extends Communicator.Operator.Operator {
    constructor(viewer) {
        super();
        this._viewer = viewer;
    }
    async _addMarkupItem(position) {
        const model = this._viewer.model;
        const config = new Communicator.PickConfig(Communicator.SelectionMask.Face);
        const selectionItem = await this._viewer.view.pickFromPoint(position, config);
        if (selectionItem === null || !!selectionItem.overlayIndex()) {
            return;
        }
        const nodeId = selectionItem.getNodeId();
        const selectionPosition = selectionItem.getPosition();
        const faceEntity = selectionItem.getFaceEntity();
        if (nodeId === null || selectionPosition === null || faceEntity === null) {
            return;
        }
        const parentNodeId = model.getNodeParent(nodeId);
        if (parentNodeId === null) {
            return;
        }
        const nodeName = model.getNodeName(nodeId);
        if (nodeName === null) {
            return;
        }
        const normal = faceEntity.getNormal();
        this._activeMarkupItem = new CustomMarkupItem(this._viewer, nodeId, nodeName, selectionPosition, normal, 0);
        this._viewer.markupManager.registerMarkup(this._activeMarkupItem);
        this._handled = true;
    }
    _updateActiveMarkupItem(position) {
        if (this._activeMarkupItem === null) {
            return;
        }
        const p1 = this._activeMarkupItem.getPosition();
        const p2 = Communicator.Point3.add(this._activeMarkupItem.getNormal(), p1);
        const p3 = this._viewer.view.unprojectPoint(position, 0);
        const p4 = this._viewer.view.unprojectPoint(position, 0.5);
        if (p3 === null || p4 === null) {
            return;
        }
        const intersection = Communicator.Util.lineLineIntersect(p1, p2, p3, p4);
        if (intersection === null) {
            return;
        }
        const length = Communicator.Point3.subtract(intersection, p1).length();
        this._activeMarkupItem.setLength(length);
        this._viewer.markupManager.refreshMarkup();
    }
    onMouseDown(event) {
        this._handled = false;
        const markup = this._viewer.markupManager.pickMarkupItem(event.getPosition());
        if (markup instanceof CustomMarkupItem) {
            this._activeMarkupItem = markup;
            this._handled = true;
        }
        else {
            this._addMarkupItem(event.getPosition());
        }
    }
    onMouseMove(event) {
        event.setHandled(this._handled);
        if (this._activeMarkupItem !== null && this._handled) {
            this._updateActiveMarkupItem(event.getPosition());
        }
    }
    onMouseUp(event) {
        event.setHandled(this._handled);
        this._activeMarkupItem = null;
    }
}