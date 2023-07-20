# 标注画布

## 标注类型
- 矩形
- - 拖拽绘制
- - 完成之后, 选中可以拖动4个顶点


## 对象状态

### 绘制状态

#### 多边形&线段
#### 矩形
- 按下鼠标确定矩形的起点
- 移动后松开鼠标确定矩形的终点

### 编辑状态
- 按 `delete` 删除选中的对象
#### 矩形
- 按住控制点 调整矩形的宽/高




## 标注对象统一函数
- `destory` 销毁
- `render` 渲染
- `select` 选中
- `unSelect` 取消选中

## 标注对象统一属性
- `status` 状态  绘制中 完成 编辑
- `type` 类型  多边形 矩形 文本
- `label` 标签
- `stroke` 线条颜色
- `fill` 填充颜色




参考
- https://app.cvat.ai/
- https://github.com/microsoft/VoTT   JS开发
- https://github.com/CVHub520/X-AnyLabeling
- https://github.com/ZeXin-Wang/labelimg