import { Ellipse, Group, IPointData, Path, Rect, Text } from 'leafer-ui'
import { genUUID } from '../utils/uuid'
import { isPointInPolygon } from '../utils/geometry'
import MarkCanvas from '..'
import MarkObject from './object'
import { MarkObjectType, MarkRectObject } from '.'

/**
 * 标注对象 POLYGON
 */
export default class MarkPolygonObject extends MarkObject {
  // 最后按下
  lastPointDown?: IPointData
  constructor(box: MarkCanvas) {
    super()
    // 生成随机ID
    this.id = genUUID()
    // 设置最小点位数量
    this.minPointCount = 3

    // 标注类型
    this.type = MarkObjectType.POLYGON

    // 设置父级容器
    this.box = box
    this.index = box.markObjectList.length + 1

    // 创建分组
    this.obj = new Group({ x: 0, y: 0 })
    // 添加到画布
    this.box.objectsLayer.add(this.obj)

    // 盒子事件

    this.boxEventIds = [
      this.box.app.on_('onzoom', this.boxOnZoom, this), // 缩放监听
      this.box.app.on_('onTranslate', this.boxOnTranslate, this), // 平移监听
      this.box.app.on_('onpointleave', this.boxOnPointLeave, this), // 离开画布
      this.box.app.on_('onpointmove', this.boxOnPointMove, this), // 鼠标移动
      this.box.app.on_('onpointdown', this.boxOnPointDown, this), // 鼠标按下
      this.box.app.on_('onpointup', this.boxOnPointUp, this), // 鼠标松开
      this.box.app.on_('oncontextmenu', this.boxOnContextMenu, this) // 右键事件
    ]
  }
  /** 鼠标按下 */
  async boxOnPointDown(e: IPointData) {
    if (this.status == 'draw') { // 绘制中
      this.lastPointDown = e
      if (this.pointList.length >= 3) {
        let lineW = this.box.config.lineWidth / this.box.curLayout.zoom
        let offset = { x: e.x - this.pointList[0].x, y: e.y - this.pointList[0].y }

        if (Math.abs(offset.x) < lineW * 4 && Math.abs(offset.y) < lineW * 4) {
          await this.complete()
          return
        }
      }

      this.pointList.push(e)
      this.render()
    }

    // 鼠标在标注内部点击
    if (this.mouseEnter && (this.status == 'done' || this.status == 'edit')) {
      if (this.box.selectObject && this.box.selectObject.id !== this.id) {
        this.box.selectObject.status = 'done'
        this.box.selectObject.render()
        this.box.selectObject = undefined
      }

      // 设置状态
      if (this.status != 'edit') {
        this.status = 'edit'
        this.box.app.emit('onchange')
      }

      this.box.selectObject = this
      this.mouseDown = true
      this.lastMousePoint = this.box.lastPoint!
      // 判断当前点位距离哪一个点最近
      this.acctivePointIndex = this.getMinDistance(this.lastMousePoint)
      this.render()
    } else if (this.status == 'edit') { // 标注外部点击 取消选中状态
      this.status = 'done'
      this.box.selectObject = undefined
      this.render()
      this.box.app.emit('onchange')
    }
  }
  /**
   * 获取鼠标距离那个点最近
   * @param oPoint 
   * @returns 
   */
  getMinDistance(oPoint: IPointData) {
    let minDistance = Infinity
    let minDistanceIndex = -1
    this.pointList.forEach((point, index) => {
      let distance = Math.sqrt(Math.pow(point.x - oPoint.x, 2) + Math.pow(point.y - oPoint.y, 2))
      if (distance < minDistance) {
        minDistance = distance
        minDistanceIndex = index
      }
    })
    let expand = 8 / this.box.curLayout.zoom
    if (minDistance < expand) return minDistanceIndex
    return -1
  }
  /** 鼠标移动 */
  boxOnPointMove() {
    if (this.mouseDown && this.status == 'edit') {
      // 偏移量
      let offset = {
        x: this.box.lastPoint!.x - this.lastMousePoint!.x,
        y: this.box.lastPoint!.y - this.lastMousePoint!.y
      }

      if (this.acctivePointIndex == -1) {
        // 更新点位
        this.pointList = this.pointList.map(point => {
          return {
            x: point.x + offset.x,
            y: point.y + offset.y
          }
        })
      } else {
        // 更新点位
        this.pointList[this.acctivePointIndex] = { x: this.lastMousePoint!.x, y: this.lastMousePoint!.y }
      }

      // 更新最后鼠标位置
      this.lastMousePoint = this.box.lastPoint!
    } else if (this.status == 'edit') {
      this.acctivePointIndex = this.getMinDistance(this.box.lastPoint!)
    }
    this.render()
  }
  /** 鼠标松开 */
  boxOnPointUp() {
    this.mouseDown = false
  }
  /** 离开画布 */
  boxOnPointLeave() {
    this.mouseDown = false
    this.acctivePointIndex = -1
    this.render()
  }
  /** 右键 */
  boxOnContextMenu() {
    this.pointList.pop()
    this.render()
  }
  /** 缩放 */
  boxOnZoom() {
    this.render()
  }
  /** 平移 */
  boxOnTranslate() {
    this.render()
  }
  /** 销毁 */
  destory() {
    // 取消事件监听
    this.box.app.off_(this.boxEventIds)
    this.obj.off_(this.objoxEventIds)

    // 清空画布
    for (let i = 0; i < this.obj.children.length; i++) this.obj.remove(this.obj.children[i])
    this.obj.children = []

    // 删除画布元素
    this.box.objectsLayer.remove(this.obj)

    // 销毁元素
    // this.obj.destroy()
    this.box.app.emit('onchange')
  }
  /** 完成 */
  async complete() {
    // 点位数量不足
    if (this.pointList.length < this.minPointCount) return

    // 发送通知获取前端进程的标签数据
    this.completeing = true
    let labelData = await new Promise((resolve, reject) => {
      this.box.app.emit('oncomplete', { ok: resolve, err: reject })
    }).catch(() => {
      this.completeing = false
      this.render()
      throw Error('The mark object has not been assigned a label.')
    }) as ObjectLabelData

    // 设置标签
    this.completeing = false
    this.label = labelData.label
    this.color = labelData.color

    this.status = 'done'
    this.render()

    // 取消事件监听
    // this.box.app.off_(this.boxEventIds)
    // this.obj.off_(this.objoxEventIds)

    let obj = null
    if (this.box.currentDrawingType == MarkObjectType.RECT) {
      obj = new MarkRectObject(this.box)
    } else if (this.box.currentDrawingType == MarkObjectType.POLYGON) {
      obj = new MarkPolygonObject(this.box)
    }
    obj && this.box.markObjectList.push(obj)

    this.box.app.emit('onchange')
  }
  /** 渲染 */
  render() {
    // 已完中止绘制
    // if (this.status == 'done') return
    // 清空分组元素
    for (let i = 0; i < this.obj.children.length; i++) this.obj.remove(this.obj.children[i])
    this.obj.children = []
    // 重置定位
    this.obj.x = 0, this.obj.y = 0

    // 是否存在最后按下点位
    let lastPoint = this.box.lastPoint && this.box.lastPoint.x && this.box.lastPoint.y

    // 缩放比例
    let zoom = this.box.curLayout.zoom

    // 绘制一个序号
    if (this.pointList[0] || lastPoint && this.pointList.length > 0) {
      let point = this.pointList[0] || this.box.lastPoint
      // 绘制一个方块
      let _box = new Rect({
        x: point.x,
        y: point.y - 20 / zoom,
        width: 30 / zoom,
        height: 20 / zoom,
        fill: "rgba(0,0,0,1)",
      })
      this.obj.add(_box)

      // 绘制文本
      let _text = new Text({
        width: 30 / zoom,
        height: 20 / zoom,
        x: point.x,
        y: point.y - 20 / zoom,
        fill: '#fff',
        textAlign: 'center',
        verticalAlign: 'middle',
        text: this.index.toString(),
        fontSize: 12 / zoom,
      })
      this.obj.add(_text)
    }

    // 线宽
    let lineW = this.box.config.lineWidth / zoom
    let path = new Path({
      path: "",
      windingRule: "evenodd",
      stroke: this.color,
      fill: (this.mouseEnter || this.status == 'edit') ? "rgba(255, 255, 255, 0.5)" : "rgba(0,0,0,0)",
      strokeWidth: lineW
    })
    this.obj.add(path)

    // 循环绘制点位
    this.pointList.forEach((point, index) => {
      // 绘制线段
      if (index === 0) {
        path.path += `M${point.x},${point.y} `
      } else {
        path.path += `L${point.x},${point.y} `
      }

      // 非编辑模式下只显示第一个顶点
      if (
        this.status !== 'done' ||
        index === 0 &&
        this.box.selectObject == this
      ) {
        let _vertex = new Ellipse({
          x: point.x - lineW * 2,
          y: point.y - lineW * 2,
          width: lineW * 4,
          height: lineW * 4,
          fill: this.color
        })
        this.obj.add(_vertex)
      }

      if (this.acctivePointIndex === index) {
        let _vertex = new Ellipse({
          x: point.x - lineW * 4,
          y: point.y - lineW * 4,
          width: lineW * 8,
          height: lineW * 8,
          fill: this.color
        })
        this.obj.add(_vertex)
      }
    })

    if (this.status == 'done' || this.status == 'edit') {
      path.path += "Z"
    } else if (lastPoint && !this.completeing) {
      let point = this.box.lastPoint!
      let _path = '', _vertex = new Ellipse({
        width: lineW * 4,
        height: lineW * 4,
        fill: this.color
      })

      if (this.pointList.length >= 3) {
        let offset = { x: point.x - this.pointList[0].x, y: point.y - this.pointList[0].y }
        if (Math.abs(offset.x) < lineW * 4 && Math.abs(offset.y) < lineW * 4) {
          _path = `L${this.pointList[0].x},${this.pointList[0].y} `
          _vertex.width = lineW * 10
          _vertex.height = lineW * 10
          _vertex.x = this.pointList[0].x - lineW * 5
          _vertex.y = this.pointList[0].y - lineW * 5
        }
      }

      if (!_path) {
        _path = `L${point.x},${point.y} `
        _vertex.x = point.x - lineW * 2
        _vertex.y = point.y - lineW * 2
      }

      path.path += _path
      this.obj.add(_vertex)
    }
  }
  /** 判断点是否在多边形内部 */
  isPointInside(point: IPointData): boolean {
    let expand = 8 / this.box.curLayout.zoom
    let offset = isPointInPolygon(point, this.pointList)
    // this.mouseEnter = offset < expand
    // this.render()
    return offset < expand
  }
  /** 导出数据 */
  export(): MarkObjectJSON {
    return {
      index: this.index,
      type: this.type,
      label: this.label,
      color: this.color,
      pointList: this.pointList,
    }
  }
  /** 导入 */
  static import(box: MarkCanvas, data: MarkObjectJSON): MarkPolygonObject {
    let obj = new this(box)
    obj.label = data.label
    obj.color = data.color
    obj.pointList = data.pointList
    obj.status = 'done'
    obj.render()

    // 取消事件监听
    // obj.box.app.off_(obj.boxEventIds)
    // obj.obj.off_(obj.objoxEventIds)
    return obj
  }
}