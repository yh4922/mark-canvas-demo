import { Group, IEventListenerId, IPointData } from 'leafer-ui'
import MarkCanvas from '..';
import { MarkObjectType } from '.';



/**
 * 标注对象
 */
class MarkObject {
  /** 标注ID  初始化随机生成 用来比对区分的 */
  id = ''
  // 点位列表
  pointList = []
  // 最小点位数量  如果小于这个就不能完成绘制
  minPointCount
  // 对象类型
  type
  // 标签
  label = ''
  // 标签颜色
  color = '#ffff00'
  // 序号
  index = 1
  // 父级容器
  box
  // 容器事件ID
  boxEventIds = []
  // 绘制对象
  obj;
  // 对象事件ID
  objoxEventIds = []
  // 状态  draw=绘制中  edit=编辑中 done=已完成
  status = 'draw'
  // 完成中
  completeing = false
  // 鼠标进入
  mouseEnter = false
  // 鼠标按下
  mouseDown = false
  // 鼠标最后按下坐标
  lastMousePoint = { x: 0, y: 0 }
  /** 激活点位 */
  acctivePointIndex = -1
  // 拖拽状态
  dragStatus = false
  /**
   * 设置标签
   * @param data 
   */
  setLabel(data) {
    this.label = data.label
    this.color = data.color
    this.render()
    this.box.app.emit('onchange')
  }
  /**
   * 设置选中状态
   * @param select 
   */
  setSelect(select) {
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