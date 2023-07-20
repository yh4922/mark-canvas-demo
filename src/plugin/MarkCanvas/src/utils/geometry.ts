import { IPointData } from "leafer-ui";

/**
 * 判断点是否在多边形内部
 * @param point 点位
 * @param polygon 多边形点位列表
 * @param expand 向外扩展  点位在多边形外围多少像素内都算在多边形内 默认5
 * @returns boolean
 */
function isPointInPolygon(point: IPointData, polygon: IPointData[]): number {
  let inside = false;
  let minDist = Infinity;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;

    // Compute distance from point to line segment (xi,yi)-(xj,yj)
    const dx = xj - xi, dy = yj - yi;
    const t = ((point.x - xi) * dx + (point.y - yi) * dy) / (dx * dx + dy * dy);
    const t_clamped = Math.max(0, Math.min(1, t));
    const nearest_x = xi + t_clamped * dx;
    const nearest_y = yi + t_clamped * dy;
    const dist = Math.sqrt((point.x - nearest_x) ** 2 + (point.y - nearest_y) ** 2);
    if (dist < minDist) minDist = dist;
  }

  return inside ? -minDist : minDist;
}





export { isPointInPolygon }