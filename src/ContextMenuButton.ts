import OBR, {
    buildShape,
    ContextMenuContext,
    ContextMenuIcon,
    ContextMenuItem,
    isImage,
    isShape,
    Item,
    Vector2,
} from '@owlbear-rodeo/sdk';
import getId from './getId';

export class ContextMenuButton implements ContextMenuItem {
    id = getId('context-menu');

    icons: ContextMenuIcon[] = [{
        icon: '/icon.svg',
        label: 'Set Default View',
        filter: {
            roles: ['GM'],
            max: 1,
            every: [
                { key: 'type', value: 'IMAGE', coordinator: '||' },
                { key: 'type', value: 'SHAPE' },
                { key: 'layer', value: 'MAP' },
                { key: ['metadata', getId('item')], operator: '!=', value: true },
            ],
        },
    }];

    private getSize (item: Item): Vector2 {
        if (isImage(item)) {
            return { x: item.image.width, y: item.image.height };
        }
        if (isShape(item)) {
            return { x: item.width, y: item.height };
        }
        throw new Error('Unknown item type');
    }

    async onClick (context: ContextMenuContext, elementId: string): Promise<void> {

        // Get the item we're working with.
        if (context.items.length != 1)
            return;
        const targetItem = context.items[0];

        // Work out what z-index to use.
        const allMaps = await OBR.scene.items.getItems((i: Item) => i.layer === 'MAP');
        const minZ = Math.min(...allMaps.map((i) => i.zIndex));

        // See if we already have a default view item, and kill it.
        const existingRectangles = await OBR.scene.items.getItems((i: Item) => i.metadata.hasOwnProperty(getId('item')));
        if (existingRectangles.length > 0) {
            OBR.scene.items.deleteItems(existingRectangles.map((i) => i.id));
        }

        // Calculate the size of the target item.
        const size = this.getSize(targetItem);

        // Make a rectangle, move it to the bottom, and attach it to the map.
        const rect = buildShape()
            .zIndex(minZ - 1)
            .position(targetItem.position)
            .width(size.x)
            .height(size.y)
            .scale(targetItem.scale)
            .rotation(targetItem.rotation)
            .layer('MAP')
            .fillOpacity(0)
            .disableHit(true)
            .visible(true)
            .strokeWidth(0)
            .metadata({ [getId('item')]: true })
            .name('Default View Object')
            .attachedTo(targetItem.id)
            .disableAutoZIndex(true)
            .build();

        await OBR.scene.items.addItems([rect]);
    }
}
