/** 标注画布的布局信息 */
interface MarkLayout {
  zoom: number,
  offsetx: number,
  offsety: number
}

/** 标注画布大小 */
interface MarkSize {
  width: number,
  height: number,
}

/** 画布配置 */
interface MarkConfig {
  // 线宽
  lineWidth: number
}

interface MarkOptions {
  /** 标注对象状态 */
  status: 'draw' | 'done' | 'edit',
  /** 对象类型 */
  type: 'rect' | 'polygon' | 'text',
  /** 对象标签 */
  label: string,

  /** 销毁 */
  destory: () => void
  /** 执行渲染 */
  render: () => void
  /** 选中 */
  select: () => void
  /** 取消选中 */
  unSelect: () => void
}


interface ObjectLabelData {
  label: string,
  color: string,
}


interface ObjectCompleteHandle {
  ok(labelData: ObjectLabelData): void,
  err(): void,
}

interface MarkObjectJSON {
  // 序号 排序不会影响序号
  index: number
  // 标签
  label: string
  // 标签颜色
  color: string
  // 标注类型
  type: MarkObjectType
  // 点位列表
  pointList: IPointData[]
}

interface MarkObjectInfo {
  // ID
  id: string
  // 标签
  label: string
  // 标签颜色
  color: string
  // 是否xuanzhogn
  select: boolean
}

type MarkObjectId = string

