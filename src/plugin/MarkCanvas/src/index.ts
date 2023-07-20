import {
  ILeaferConfig,
  IPointData, Leafer, Path, App, LeafHelper, Image, ImageEvent, PointerEvent,
  ZoomEvent, MoveEvent, Rect, Line
} from 'leafer-ui'

// import anime from 'animejs/lib/anime.es.js';

import { MarkObjectType, MarkObject, MarkRectObject, MarkPolygonObject } from './object'

// const colors = ["rgb(252, 45, 19)", "rgb(246, 255, 72)", "rgb(59, 59, 254)", "rgb(0, 209, 1)", "rgb(79, 255, 228)", "rgb(253, 136, 33)", "rgb(249, 18, 119)", "rgb(240, 88, 235)", "rgb(219, 247, 215)", "rgb(188, 97, 36)", "rgb(21, 225, 157)", "rgb(160, 166, 54)", "rgb(242, 180, 122)", "rgb(196, 168, 219)", "rgb(27, 55, 29)", "rgb(149, 12, 20)"]

class MarkCanvas {
  // app 集成 APP 单独设置 view 为HTMLElement
  app: App
  // 配置
  config: MarkConfig
  // 初始布局
  initLayout: MarkLayout = { zoom: 1, offsetx: 0, offsety: 0 }
  // 当前布局
  curLayout: MarkLayout = { zoom: 1, offsetx: 0, offsety: 0 }
  // 初始大小
  originSize: MarkSize = { width: 0, height: 0 }
  // 最后鼠标光标位置
  lastMovePoint?: IPointData
  // 标注对象图层
  objectsLayer: Leafer
  // 背景图片
  backgroundImage: Image
  // 辅助图层
  guideLayer: Leafer
  // 辅助线
  guideLine: Path
  // 选择模式
  selectMode: boolean = true
  /** 选中标注对象下标 */
  selectObject?: MarkObject
  // 平移状态
  moveStatus: boolean = false
  // 鼠标按下
  mouseDown: boolean = false
  // 缩放状态
  zoomStatus: boolean = false
  // 全局键盘按下事件
  windowKeydown: (e: KeyboardEvent) => void
  // 全局键盘抬起事件
  windowKeyup: (e: KeyboardEvent) => void
  // 鼠标移动事件
  docMouseMove: (e: MouseEvent) => void
  // 当前绘制类型
  currentDrawingType: MarkObjectType = MarkObjectType.NONE
  // 标注对象列表
  markObjectList: MarkObject[] = []
  /**
   * 初始化标注画布
   * @param userConfig
   */
  constructor(userConfig: ILeaferConfig, config?: MarkConfig) {
    // 初始化应用
    this.app = new App({
      type: "user",
      ...userConfig
    })

    // 默认配置
    this.config = {
      lineWidth: 2,
    }

    // 合并配置
    Object.assign(this.config, config || {})

    // 设置光标样式
    this.view.style.cursor = 'default'
    // 禁用右键菜单
    this.view.oncontextmenu = () => {
      let point = this.pointMapping(this.lastMovePoint!)
      this.app.emit("oncontextmenu", point)
      return false
    }

    // 标注对象图层
    this.objectsLayer = this.app.addLeafer()

    // 背景图片
    this.backgroundImage = new Image()
    this.objectsLayer.add(this.backgroundImage)

    // let line0 = new Line({ x: 0, y: 0, strokeWidth: 5, width: 0, stroke: "red", rotation: 45 })
    // let line1 = new Line({ x: 100, y: 100, strokeWidth: 5, width: 0, stroke: "red" })
    // let line2 = new Line({ x: 300, y: 100, strokeWidth: 5, width: 0, stroke: "red", rotation: 90 })
    // let line3 = new Line({ x: 300, y: 200, strokeWidth: 5, width: 0, stroke: "red", rotation: 135 })
    // this.objectsLayer.add(line0)
    // this.objectsLayer.add(line1)
    // this.objectsLayer.add(line2)
    // this.objectsLayer.add(line3)

    // setTimeout(() => {
    //   let time = 200
    //   anime({ targets: line0, easing: 'linear', width: 141.4213562373095, duration: time, delay: time * 0 })
    //   anime({ targets: line1, easing: 'linear', width: 200, duration: time, delay: time * 1 })
    //   anime({ targets: line2, easing: 'linear', width: 100, duration: time, delay: time * 2 })
    //   anime({ targets: line3, easing: 'easeInOutQuad', width: 200, duration: time, delay: time * 3 })
    // }, 1000)

    // 辅助提示图层
    this.guideLayer = this.app.addLeafer({ hittable: false })

    // 辅助线
    this.guideLine = new Path({ x: 0, y: 0, stroke: 'red', strokeWidth: 0.5, hitFill: 'none' })
    this.guideLayer.add(this.guideLine);
    // this.guideLine.fill

    // 监听鼠标事件
    // this.app.on_(PointerEvent.MOVE, this.appPointMove, this)
    this.app.on_(PointerEvent.DOWN, this.appPointDown, this)
    this.app.on_(PointerEvent.UP, this.appPointUp, this)
    this.app.on_(PointerEvent.DOUBLE_TAP, this.appPointDoubleTap, this)
    // this.view.addEventListener('mouseleave', this.appPointLeave.bind(this))

    // 缩放事件
    this.app.on(ZoomEvent.START, () => (this.zoomStatus = true))
    this.app.on_(ZoomEvent.ZOOM, this.appZooming, this)
    this.app.on(ZoomEvent.END, () => (this.zoomStatus = false))

    // 平移事件
    // this.app.on(MoveEvent.START, () => (this.moveStatus = true))
    this.app.on_(MoveEvent.MOVE, this.appMoving, this)
    // this.app.on(MoveEvent.END, () => (this.moveStatus = false))

    // 全局键盘事件
    this.windowKeydown = this._windowKeydown.bind(this)
    this.windowKeyup = this._windowKeyup.bind(this)
    window.addEventListener('keydown', this.windowKeydown)
    window.addEventListener('keyup', this.windowKeyup)


    this.docMouseMove = (e) => {
      let { x, y } = this.view.getBoundingClientRect()
      x = e.clientX - x
      y = e.clientY - y
      // let point = this.pointMapping({ x, y })
      let event: any = { x, y }
      if (e.target) event.origin = { target: e.target }
      event.buttons = e.buttons
      event.spaceKey = this.moveStatus
      this.appPointMove(event as PointerEvent)
    }
    document.addEventListener('mousemove', this.docMouseMove)
  }
  /** 获取画布DOM */
  get view(): HTMLElement {
    return this.app.view as HTMLElement
  }
  /** 加载初始背景 */
  async setBackground(path: string) {
    return new Promise((resolve) => {
      // 图片对象
      // const image = new Image({ url: path })
      this.backgroundImage.url = path

      // 图片加载
      this.backgroundImage.once(ImageEvent.LOADED, (e: ImageEvent) => {
        // 记录图片原始大小  后续所有的坐标都基于这个尺寸
        this.originSize = { width: e.image.width, height: e.image.height }
        this.backgroundImage.width = e.image.width
        this.backgroundImage.height = e.image.height

        // 计算设置缩放
        let zoomx = this.app.width / e.image.width
        let zoomy = this.app.height / e.image.height
        let zoom = Math.min(zoomx, zoomy)

        // 计算偏移
        let offsetx = (this.app.width - e.image.width * zoom) / 2
        let offsety = (this.app.height - e.image.height * zoom) / 2

        // 先缩放完再平移
        this.scale(zoom)
        this.translate(offsetx, offsety)

        // 保存初始布局
        this.initLayout = { zoom, offsetx, offsety }
        this.curLayout = this.initLayout

        resolve(null)
      })
    })
  }
  /** 设置标注对象 */
  setObjectData(list: MarkObjectJSON[]) {
    list.forEach((item) => {
      let obj;
      if (item.type === MarkObjectType.POLYGON) {
        obj = MarkPolygonObject.import(this, item)
      } else if (item.type === MarkObjectType.RECT) {
        obj = MarkRectObject.import(this, item)
      }
      obj && this.markObjectList.push(obj)
    })
    this.app.emit('onchange')
  }
  /**
   * 排序对象
   * @param ids 
   */
  sortObject(ids: MarkObjectId[]) {
    let list: MarkObject[] = []

    ids.forEach((id) => {
      let obj = this.markObjectList.find((item) => item.id === id)
      this.markObjectList = this.markObjectList.filter((item) => item.id !== id)
      if (obj) list.push(obj)
    })

    this.markObjectList.push(...list)
    this.markObjectList.forEach((obj, i) => {
      obj.index = i + 1
      obj.render()
    })
    this.app.emit('onchange')
  }
  /**
   * 选中对象ID
   * @param id 
   */
  selectObjectById(id: MarkObjectId) {
    let obj = this.markObjectList.find((item) => item.id === id)
    if (obj) obj.setSelect(true)
  }
  /**
   * 设置对象标签
   * @param id 
   * @param data 
   */
  setObjectLabel(id: MarkObjectId, data: ObjectLabelData) {
    let obj = this.markObjectList.find((item) => item.id === id)
    if (obj) obj.setLabel(data)
  }
  /**
   * 删除对象
   * @param id 
   */
  deleteObject(id: MarkObjectId) {
    let obj = this.markObjectList.find((item) => item.id === id)
    if (obj) obj.destory()
    this.markObjectList = this.markObjectList.filter((item) => item.id !== id)
    this.app.emit('onchange')
  }
  /** 设置选择模式 */
  setSelectMode(mode: boolean) {
    if (this.selectMode == mode) return

    // 选中状态取消当前绘制
    if (mode) this.setDrawType(MarkObjectType.NONE)
    if (this.selectObject) {
      this.selectObject.status = 'done'
      this.selectObject.render()
      this.selectObject = undefined
    }

    this.selectMode = mode
    if (this.lastMovePoint) this.appPointMove({ ...this.lastMovePoint, spaceKey: this.moveStatus } as PointerEvent);
    this.app.emit("onselect", { status: mode })
  }
  /** 缩放画布 */
  scale(zoom: number) {
    // 缩放标注图层
    this.objectsLayer.zoomLayer.scaleX = zoom
    this.objectsLayer.zoomLayer.scaleY = zoom

    // 保存缩放并触发事件
    this.curLayout.zoom = zoom
    this.app.emit('onzoom', { zoom })
  }
  /** 平移画布 */
  translate(x: number, y: number) {
    // 平移标注图层
    this.objectsLayer.moveLayer.x = x
    this.objectsLayer.moveLayer.y = y

    // 保存平移并触发事件
    this.curLayout.offsetx = x
    this.curLayout.offsety = y
    this.app.emit('onTranslate', { x, y })
  }
  /** 设置移动状态 */
  setMoveStatus(status: boolean) {
    if (this.moveStatus == status) return
    this.moveStatus = status
    this.lastMovePoint && this.appPointMove({ ...this.lastMovePoint, spaceKey: status } as PointerEvent);
    this.app.emit("onmove", { status })
  }
  /** 计算相对底图的坐标点位 */
  pointMapping(point: IPointData): IPointData {
    // 新的点位
    let newPoint = { x: 0, y: 0 }
    // 还原偏移缩放
    newPoint.x = (point.x - this.curLayout.offsetx) / this.curLayout.zoom
    newPoint.y = (point.y - this.curLayout.offsety) / this.curLayout.zoom
    // 返回
    return newPoint
  }
  /** 最后点位 */
  get lastPoint(): IPointData | null {
    if (!this.lastMovePoint) return null
    return this.pointMapping(this.lastMovePoint)
  }
  /** 画布鼠标移动 */
  appPointMove(e: PointerEvent) {
    // 判断元素不处于画布上离开画布
    // if (e.origin) {
    //   if (e.origin.target !== this.view) {
    //     return this.appPointLeave()
    //   }
    // }

    let point = this.pointMapping(e)

    // 当前没有选中编辑对象
    let indexs: number[] = this.markObjectList.map((obj, i) => {
      obj.mouseEnter = false; obj.render(); return i
    }).reverse()

    // 当前没有选中 且 处于选中模式
    if (this.selectMode) {
      // 查找最上层的标注对象
      let index = indexs.find((i) => this.markObjectList[i].isPointInside(point))
      if (index !== undefined && this.markObjectList[index]) {
        this.markObjectList[index].mouseEnter = true
        this.markObjectList[index].render()
      }
    }

    // 清空辅助线
    this.guideLine.path = ""
    // 记录最后的坐标
    e.buttons !== undefined && (this.lastMovePoint = { x: e.x, y: e.y })

    // 设置平移光标
    e.spaceKey && (this.view.style.cursor = 'move')
    document.body.offsetHeight;

    // 非平移状态 设置光标
    if (!e.spaceKey) {
      // 恢复默认光标
      this.view.style.cursor = 'default'

      // 绘制状态
      let drawStatus = !!this.markObjectList.find(item => item.status === 'draw')

      // 根据状态设置光标
      if (this.selectMode) {
        this.view.style.cursor = 'pointer'
      } else if (drawStatus) {
        this.view.style.cursor = 'crosshair'
      }
    }

    // 绘制辅助线
    e.buttons !== undefined && this.renderGuideLine(e)
    e.buttons !== undefined && this.app.emit("onpointmove", point)
  }
  /** 离开画布 */
  appPointLeave() {
    this.lastMovePoint = undefined
    this.app.emit("onpointleave")
  }
  /** 绘制辅助线 */
  renderGuideLine(e: PointerEvent) {
    // 初始化路径
    let path = ""

    if (this.moveStatus) {
      return this.guideLine.path = path
    }

    // 绘制横线
    let start = 0;
    while (start < this.app.width) {
      path += `M ${start} ${e.y} L ${start + 10} ${e.y} `
      start += 15
    }

    // 绘制竖线
    start = 0;
    while (start < this.app.height) {
      path += `M ${e.x} ${start} L ${e.x} ${start + 10} `
      start += 15
    }

    this.guideLine.path = path
  }
  /** 鼠标按下事件 */
  appPointDown(e: PointerEvent) {
    if (this.moveStatus) return
    let point = this.pointMapping(e)
    e.buttons === 1 && this.app.emit("onpointdown", point)
  }
  /** 鼠标抬起事件 */
  appPointUp(e: PointerEvent) {
    if (this.moveStatus) return
    let point = this.pointMapping(e)
    this.app.emit("onpointup", point)
  }
  /** 双击画布 */
  appPointDoubleTap() {
    if (this.markObjectList.length) {
      let obj = this.markObjectList[this.markObjectList.length - 1]
      if (obj.status == 'draw') return
    }

    let { width, height } = this.originSize
    // 计算设置缩放
    let zoomx = this.app.width / width
    let zoomy = this.app.height / height
    let zoom = Math.min(zoomx, zoomy)

    // 计算偏移
    let offsetx = (this.app.width - width * zoom) / 2
    let offsety = (this.app.height - height * zoom) / 2

    this.scale(zoom)
    this.translate(offsetx, offsety)

    // 设置初始布局
    this.initLayout = { zoom, offsetx, offsety }
  }
  /** 缩放事件 */
  appZooming(e: ZoomEvent) {
    // 缩放中心点
    const center = { x: e.x, y: e.y }
    // 计算新的缩放大小
    let scale = e.scale > 1 ? 1.1 : 0.9
    // 平移画布
    LeafHelper.zoomOf(this.objectsLayer, center, scale)
    // 修正坐标
    this.scale(this.objectsLayer.zoomLayer.scaleX!)
    this.translate(this.objectsLayer.moveLayer.x!, this.objectsLayer.moveLayer.y!)
  }
  /** 平移事件 */
  appMoving(e: MoveEvent) {
    if (e.buttons == 0) return
    LeafHelper.move(this.objectsLayer, e.moveX, e.moveY)
    this.scale(this.objectsLayer.zoomLayer.scaleX!)
    this.translate(this.objectsLayer.moveLayer.x!, this.objectsLayer.moveLayer.y!)
    this.setMoveStatus(true)
  }
  /** 键盘按下 */
  private async _windowKeydown(e: KeyboardEvent) {
    if (e.code == 'Space') {
      this.setMoveStatus(true)
      e.preventDefault()
    }

    if (e.code == 'NumpadEnter' || e.code == 'Enter') {
      let obj = this.markObjectList[this.markObjectList.length - 1]
      if (obj.status == 'draw') {
        await obj.complete()
      }
    }

    if (e.code == 'Delete') {
      // 删除选中的标注对象
      let obj = this.markObjectList.find(item => item.status == 'edit')
      if (obj) {
        obj.destory()
        this.markObjectList.splice(this.markObjectList.indexOf(obj), 1)
        this.app.emit('onchange')
      }
    }
  }
  /** 键盘抬起 */
  private _windowKeyup(e: KeyboardEvent) {
    if (e.code == 'Space') {
      this.setMoveStatus(false)
    }
  }
  /** 设置绘制模式 */
  async setDrawType(type: MarkObjectType) {
    // 取消选择模式
    this.setSelectMode(false)

    // 当前存在绘制模式是取消当前绘制模式
    if (this.currentDrawingType) {

      // 获取最后一个标注对象
      let obj = this.markObjectList[this.markObjectList.length - 1]
      if (obj.pointList.length < obj.minPointCount) {
        obj.destory() // 销毁
        this.markObjectList.pop()
      } else {
        await obj.complete()
      }

      if (obj.type === type) {
        // 相同类型再次点击 取消选中
        this.currentDrawingType = MarkObjectType.NONE
        this.app.emit("ondraw", { type: MarkObjectType.NONE })
        this.appPointMove({ ...this.lastMovePoint, spaceKey: this.moveStatus } as PointerEvent);
        return
      }
    }

    // 设置新的绘制模式
    this.currentDrawingType = type

    // 添加标注元素
    if (type == MarkObjectType.RECT) {
      let obj = new MarkRectObject(this)
      this.markObjectList.push(obj)
    } else if (type == MarkObjectType.POLYGON) {
      let obj = new MarkPolygonObject(this)
      this.markObjectList.push(obj)
    }

    // 回调函数
    this.appPointMove({ ...this.lastMovePoint, spaceKey: this.moveStatus } as PointerEvent);
    this.app.emit("ondraw", { type })
  }
  /**
   * 清空画布内容
   */
  clear() {
    this.markObjectList.forEach(item => item.destory())
    this.markObjectList = []
    this.appPointMove({ ...this.lastMovePoint, spaceKey: this.moveStatus } as PointerEvent);
    this.backgroundImage.url = ''
  }
  /**
   * 获取标注对象基本信息
   */
  get objects(): MarkObjectInfo[] {
    return this.markObjectList.filter(item => item.status !== 'draw').map(obj => {
      return {
        id: obj.id,
        label: obj.label,
        color: obj.color,
        select: obj.status == 'edit',
      }
    })
  }
  /** 导出JSON数据 */
  toJSON(): MarkObjectJSON[] {
    return this.markObjectList.filter(item => item.status !== 'draw').map(obj => obj.export())
  }
  destory() {
    // 移除事件
    window.removeEventListener('keydown', this.windowKeydown)
    window.removeEventListener('keyup', this.windowKeyup)
    document.removeEventListener('mousemove', this.docMouseMove)

    // 销毁对象
    this.view.innerHTML = ''
    this.app.destory()
  }
}

export default MarkCanvas