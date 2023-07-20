import MarkObject from './object'
import MarkRectObject from './rect'
import MarkPolygonObject from './polygon'

/** 绘制图形类型 */
enum MarkObjectType {
  /** 空 */
  NONE = '',
  /** 矩形 */
  RECT = 'rect',
  /** 多边形 */
  POLYGON = 'polygon',
}


// 单个导出
export { MarkObjectType, MarkObject, MarkRectObject, MarkPolygonObject }