import { Ellipse, Group, IPointData, Path, Rect, Text } from 'leafer-ui'
import { genUUID } from '../utils/uuid'
import { isPointInPolygon } from '../utils/geometry'
import MarkCanvas from '..'
import MarkObject from './object'
import { MarkObjectType, MarkPolygonObject } from '.'

/**
 * 标注对象 POLYGON
 */
export default class MarkRectObject extends MarkObject {
  // 最后按下
  lastPointDown
  constructor(box) {
    super()
    // 生成随机ID
    this.id = genUUID()
    // 设置最小点位数量
    this.minPointCount = 2

    // 标注类型
    this.type = MarkObjectType.RECT

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
      this.box.app.on_('onpointup', this.boxOnPointUp, this) // 鼠标松开
    ]
  }
  /** 鼠标按下 */
  async boxOnPointDown(e) {
    if (this.status == 'draw') { // 绘制中
      this.lastPointDown = e
      this.pointList = [e, e]
      this.render()
    }

    // 鼠标在标注内部点击
    if (this.mouseEnter && (this.status == 'done' || this.status == 'edit')) {
      if (this.box.selectObject && this.box.selectObject.id !== this.id) {
        this.box.selectObject.status = 'done'
        this.box.selectObject.render()
        this.box.selectObject = undefined
      }
      this.status != 'edit' && this.box.app.emit('onchange')
      this.status = 'edit'
      this.box.selectObject = this
      this.mouseDown = true
      this.lastMousePoint = this.box.lastPoint
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
  getMinDistance(oPoint) {
    let minDistance = Infinity
    let minDistanceIndex = -1
    this.vertexList.forEach((point, index) => {
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
    if (this.completeing == true) return
    if (this.status == 'draw' && this.pointList[0]) {
      this.pointList[1] = this.box.lastPoint
      this.render()
    }

    if (this.mouseDown && this.status == 'edit') {
      // 偏移量
      let offset = {
        x: this.box.lastPoint.x - this.lastMousePoint.x,
        y: this.box.lastPoint.y - this.lastMousePoint.y
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
        // 矩形点位修改
        let point = { ...this.vertexList[this.acctivePointIndex] }
        let point1; // 对角点
        // 确定对角
        if (this.acctivePointIndex == 0) {
          point1 = { ...this.vertexList[2] }
        } else if (this.acctivePointIndex == 1) {
          point1 = { ...this.vertexList[3] }
        } else if (this.acctivePointIndex == 2) {
          point1 = { ...this.vertexList[0] }
        } else if (this.acctivePointIndex == 3) {
          point1 = { ...this.vertexList[1] }
        }
        point = { ...this.box.lastPoint }

        // 规划矩形的两个顶点
        let minx = Math.min(point.x, point1.x)
        let miny = Math.min(point.y, point1.y)
        let maxx = Math.max(point.x, point1.x)
        let maxy = Math.max(point.y, point1.y)
        this.pointList = [{ x: minx, y: miny }, { x: maxx, y: maxy }]

        // 根据位置确认新的控制点
        this.acctivePointIndex = this.vertexList.findIndex(item => item.x == point.x && item.y == point.y)
      }

      // 更新最后鼠标位置
      this.lastMousePoint = this.box.lastPoint
    } else if (this.status == 'edit') {
      this.acctivePointIndex = this.getMinDistance(this.box.lastPoint)
    }
    this.render()
  }
  /** 鼠标松开 */
  boxOnPointUp() {
    this.mouseDown = false
    if (this.status == 'draw' || this.status == 'edit') {
      if (this.pointList.length === 2) {
        // 排序小的在前面
        let minx = Math.min(this.pointList[0].x, this.pointList[1].x)
        let miny = Math.min(this.pointList[0].y, this.pointList[1].y)
        let maxx = Math.max(this.pointList[0].x, this.pointList[1].x)
        let maxy = Math.max(this.pointList[0].y, this.pointList[1].y)
        this.pointList = [
          { x: minx, y: miny },
          { x: maxx, y: maxy }
        ]
        this.render()
      }
    }

    if (this.status == 'draw') {
      if (this.pointList.length === 2) {
        this.complete()
      }
    }
  }
  /** 离开画布 */
  boxOnPointLeave() {
    this.mouseDown = false
    this.acctivePointIndex = -1
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

    // 判断两个点位相差超过100  
    let offset = Math.max(
      Math.abs(this.pointList[0].x - this.pointList[1].x),
      Math.abs(this.pointList[0].y - this.pointList[1].y)
    )
    if (offset < 30) {
      this.status = 'draw'
      this.pointList = []
      this.render()
      return
    }

    // 发送通知获取前端进程的标签数据
    this.completeing = true
    let labelData = await new Promise((resolve, reject) => {
      this.box.app.emit('oncomplete', { ok: resolve, err: reject })
    }).catch(() => {
      this.completeing = false
      this.pointList = []
      this.render()
      throw Error('The mark object has not been assigned a label.')
    })

    // 设置标签
    this.completeing = false
    this.label = labelData.label
    this.color = labelData.color

    this.status = 'done'
    this.render()

    let obj = null
    if (this.box.currentDrawingType == MarkObjectType.RECT) {
      obj = new MarkRectObject(this.box)
    } else if (this.box.currentDrawingType == MarkObjectType.POLYGON) {
      obj = new MarkPolygonObject(this.box)
    }
    obj && this.box.markObjectList.push(obj)
    this.box.app.emit('onchange')
  }
  /**
   * 获取矩形顶点
   */
  get vertexList() {
    if (this.pointList.length === 2) {
      // 更具矩形两个点  4个顶点
      return [
        this.pointList[0],
        { x: this.pointList[0].x, y: this.pointList[1].y },
        this.pointList[1],
        { x: this.pointList[1].x, y: this.pointList[0].y }
      ]
    } else {
      return []
    }
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


    // 缩放比例
    let zoom = this.box.curLayout.zoom

    // 绘制一个序号
    if (this.pointList.length == 2) {
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
    this.vertexList.forEach((point, index) => {
      // 绘制线段
      if (index === 0) {
        path.path += `M${point.x},${point.y} `
      } else {
        path.path += `L${point.x},${point.y} `
      }

      // 非编辑模式下只显示第一个顶点
      if (this.status == 'draw' || this.status == 'edit') {
        let _vertex = new Ellipse({
          x: point.x - lineW * 2,
          y: point.y - lineW * 2,
          width: lineW * 4,
          height: lineW * 4,
          fill: this.color
        })
        this.obj.add(_vertex)
      }
    })
    path.path += "Z"
  }
  /** 判断点是否在多边形内部 */
  isPointInside(point) {
    let expand = 8 / this.box.curLayout.zoom
    let offset = isPointInPolygon(point, this.vertexList)
    // this.mouseEnter = offset < expand
    // this.render()
    return offset < expand
  }
  /** 导出数据 */
  export() {
    return {
      index: this.index,
      type: this.type,
      label: this.label,
      color: this.color,
      pointList: this.pointList,
    }
  }
  /** 导入 */
  static import(box, data) {
    let obj = new this(box)
    obj.label = data.label
    obj.color = data.color
    obj.pointList = data.pointList
    obj.status = 'done'
    obj.render()

    // 取消事件监听
    return obj
  }
}