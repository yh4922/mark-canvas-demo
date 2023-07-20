# `MarkCanvas` 使用说明文档

## 简介
`MarkCanvas` 基于`leafer-ui`封装的图像标注工具，用于在 Vue.js 应用中实现标注功能。它提供了一系列事件和方法，用于管理标注对象、绘制标注形状、导入导出标注数据等操作。

[在线演示](https://yh4922.github.io/mark-canvas-demo/)


## 安装
1. 将 `MarkCanvas` 插件文件夹复制到你的项目中。
2. 在需要使用 `MarkCanvas` 的组件中，使用 `import` 导入 `MarkCanvas` 插件。

```typescript
import MarkCanvas from './plugin/MarkCanvas/src'

// 创建画布
const mark = new MarkCanvas({
  view: "mark-box", // ID名或者DOM对象
  fill: "#b8b8b8" // 背景
}, {
  // 配置项
})

// 设置背景图 必须有这一步才能开始绘制
mark.value.setBackground(bgImage)
```

## 配置项
- `config` 配置项
```javascript
{
  lineWidth: 2
}
```

## 事件

### `onmove`
- 描述：当画布移动状态发生变化时触发。
- 参数：`e` - 移动状态对象，包含 `status` 属性，表示移动状态是否为 `true`。
- 示例：
```typescript
mark.app.on("onmove", ({status}) => {})
```

### `onselect`
- 描述：当画布选中状态发生变化时触发。
- 参数：`e` - 选中状态对象，包含 `status` 属性，表示是否处于选择模式。
- 示例：
```typescript
// 可以用来同步工具栏状态
mark.app.on("onselect", ({status}) => {})
```

### `ondraw`
- 描述：当画布绘制模式发生变化时触发。
- 参数：`e` - 绘制模式对象，包含 `type` 属性，表示当前绘制模式的类型。
- 示例：
```typescript
mark.app.on("ondraw", (e) => {
  drawType.value = e.type as string
})
```

### `oncomplete`
- 描述：当标注对象完成时触发。
- 参数：`e` - 标注对象完成处理函数，包含 `ok` 和 `err` 两个方法，用于接受或拒绝标注对象的标签数据。
- 示例：
```typescript
mark.app.on("oncomplete", (e: ObjectCompleteHandle) => {
  showLabelInput(function (data?: ObjectLabelData | null) {
    if (data) {
      e.ok(data)
    } else {
      e.err()
    }
  })
})
```

### `onchange`
- 描述：当标注对象发生变化时触发，例如添加、删除或修改标注对象。
- 示例：
```typescript
mark.value.app.on("onchange", () => {
  objectList = JSON.parse(JSON.stringify(mark.value?.objects))
})
```

## 方法


### `setDrawType`
- 描述：设置当前的绘制模式。
- 参数：`type` - 绘制模式的类型，可以是 `'rect'` 或 `'polygon'`。
- 示例：
```typescript
mark.setDrawType(type)
```

###  `setSelectMode`
- 描述：切换选择模式。
- 参数：`mode` - 选择模式，可以是 `true` 或 `false`。
- 示例：
```typescript
mark.setSelectMode(mode)
```


### `objects`
- 描述：获取标注对象的简要信息。
- 示例：
```typescript
let list = mark.objects
```


### `toJSON`
- 描述：导出当前画布上的标注对象数据。
- 示例：
```vue
function toJSON() {
  let json = mark.toJSON()
  console.log(json)
}
```

### `setObjectData`
- 描述：导入标注对象数据到画布中。
- 示例：
```vue
mark.setObjectData(json)
```

### `clear`
- 描述：清空画布上的所有标注对象。
- 示例：
```vue
mark.clear()
```

### `sortObject`
- 描述：排序标注对象。
- 示例：
```vue
mark.sortObject(ids: string[])
```

### `selectObjectById`
- 描述：通过标注对象的 ID 来选中该对象。
- 参数：`id` - 标注对象的 ID。
- 示例：
```vue
mark.selectObjectById(id)
```

### `setLabel`
- 描述：设置标注对象的标签。
- 参数：`e` - 鼠标事件对象，用于阻止默认右键菜单的弹出；`el` - 标注对象。
- 示例：
```vue
mark.setObjectLabel(id, data)
```

###  `deleteObject`
- 描述：删除标注对象。
- 参数：`id` - 标注对象的 ID。
- 示例：
```vue
mark.deleteObject(id)
```

以上就是 `MarkCanvas` 插件的使用说明文档，希望能对你有所帮助！