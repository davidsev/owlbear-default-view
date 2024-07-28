import OBR, { buildShape, ContextMenuContext, ContextMenuIcon, ContextMenuItem, Item } from '@owlbear-rodeo/sdk';
import getId from './getId';

export class ContextMenuButton implements ContextMenuItem {
    id = getId('context-menu');

    icons: ContextMenuIcon[] = [{
        icon: '/icon.svg',
        label: 'Set Default View',
        filter: {
            roles: ['GM'],
            every: [
                { key: 'type', value: 'IMAGE', coordinator: '||' },
                { key: 'type', value: 'SHAPE' },
                { key: 'layer', value: 'MAP', coordinator: '||' },
                { key: 'layer', value: 'PROP' },
                { key: ['metadata', getId('item')], operator: '!=', value: true },
            ],
        },
    }];

    async onClick (context: ContextMenuContext, elementId: string): Promise<void> {

        // Get the item we're working with.
        if (!context.items.length)
            return;

        // Work out what z-index to use.
        const allItems = await OBR.scene.items.getItems();
        const minZ = Math.min(...allItems.map((i) => i.zIndex));

        // See if we already have a default view item, and kill it.
        const existingRectangles = await OBR.scene.items.getItems((i: Item) => i.metadata.hasOwnProperty(getId('item')));
        if (existingRectangles.length > 0) {
            OBR.scene.items.deleteItems(existingRectangles.map((i) => i.id));
        }

        // Calculate the size of the target item.
        const area = await OBR.scene.items.getItemBounds(context.items.map(x => x.id));

        // Make a rectangle, move it to the bottom, and attach it to the map.
        const rect = buildShape()
            .zIndex(minZ - 1)
            .position(area.min)
            .width(area.width)
            .height(area.height)
            .layer('MAP')
            .fillOpacity(0)
            .disableHit(true)
            .visible(true)
            .strokeWidth(0)
            .metadata({ [getId('item')]: true })
            .name('Default View Object')
            .disableAutoZIndex(true)
            .build();

        await OBR.scene.items.addItems([rect]);

        OBR.notification.show('Default View has been set', 'SUCCESS');
    }
}
