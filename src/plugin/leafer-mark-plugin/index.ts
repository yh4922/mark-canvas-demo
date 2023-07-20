// create.ts
import { IPlugin, IObject, ILeaferTypeCreator, ILeafer, IMoveEvent } from '@leafer-ui/interface'

export const plugin: IPlugin = {
  importVersion: '1.0.0.beta.2',
  import: ['LeaferTypeCreator'],
  run(LeaferUI: IObject): void {
    const LeaferTypeCreator: ILeaferTypeCreator = LeaferUI.LeaferTypeCreator
    LeaferTypeCreator.register('document', documentType)
  }
}

function documentType(leafer: ILeafer) {
  console.log('leafer', leafer)
  leafer.on('move', (e: IMoveEvent) => {
    console.log(e, leafer.moveLayer?.y)
    if (leafer.moveLayer?.y)
      leafer.moveLayer.y += e.moveY
  })
}