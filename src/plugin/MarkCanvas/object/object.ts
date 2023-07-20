import { Group, IEventListenerId, IPointData } from 'leafer-ui'
import MarkCanvas from '..';
import { MarkObjectType } from '.';



interface MarkObject {
  /** 销毁 */
  destory(): void
  /** 完成绘制 */
  complete(): void
  /** 渲染 */
  render(): void
  /** 导出函数 */
  export(): MarkObjectJSON
  /** 判断点是否在内部 */
  isPointInside(point: IPointData): boolean
}

/**
 * 标注对象
 */
class MarkObject implements MarkObject {
  /** 标注ID  初始化随机生成 用来比对区分的 */
  id: string = ''
  // 点位列表
  pointList: IPointData[] = []
  // 最小点位数量  如果小于这个就不能完成绘制
  minPointCount!: number
  // 对象类型
  type!: MarkObjectType
  // 标签
  label: string = ''
  // 标签颜色
  color: string = '#ffff00'
  // 序号
  index: number = 1
  // 父级容器
  box!: MarkCanvas;
  // 容器事件ID
  boxEventIds: IEventListenerId[] = []
  // 绘制对象
  obj!: Group;
  // 对象事件ID
  objoxEventIds: IEventListenerId[] = []
  // 状态  draw=绘制中  edit=编辑中 done=已完成
  status: 'draw' | 'edit' | 'done' = 'draw'
  // 完成中
  completeing: boolean = false
  // 鼠标进入
  mouseEnter: boolean = false
  // 鼠标按下
  mouseDown: boolean = false
  // 鼠标最后按下坐标
  lastMousePoint?: IPointData = { x: 0, y: 0 }
  /** 激活点位 */
  acctivePointIndex: number = -1
  // 拖拽状态
  dragStatus: boolean = false
  /**
   * 设置标签
   * @param data 
   */
  setLabel(data: ObjectLabelData) {
    this.label = data.label
    this.color = data.color
    this.render()
    this.box.app.emit('onchange')
  }
  /**
   * 设置选中状态
   * @param select 
   */
  setSelect(select: boolean) {
    // 清空已有选中
    if (this.box.selectObject) {
      this.box.selectObject.status = 'done'
      this.box.selectObject.render()
      this.box.selectObject = undefined
    }

    this.status = select ? 'edit' : 'done'
    this.box.selectObject = this
    this.render()
    this.box.app.emit('onchange')
  }
}

export default MarkObject