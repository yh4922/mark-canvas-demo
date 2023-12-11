import MarkObject from './object'
import MarkRectObject from './rect'
import MarkPolygonObject from './polygon'

/** 绘制图形类型 */
// enum MarkObjectType {
//   /** 空 */
//   NONE = '',
//   /** 矩形 */
//   RECT = 'rect',
//   /** 多边形 */
//   POLYGON = 'polygon',
// }

// 枚举转为js写法
const MarkObjectType = {
  NONE: '',
  RECT: 'rect',
  POLYGON: 'polygon',
}


// 单个导出
export { MarkObjectType, MarkObject, MarkRectObject, MarkPolygonObject }