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
            every: [
                { key: 'type', value: 'IMAGE', coordinator: '||' },
                { key: 'type', value: 'SHAPE' },
                { key: 'layer', value: 'MAP', coordinator: '||' },
                { key: 'layer', value: 'PROP' },
                { key: ['metadata', getId('item')], operator: '!=', value: true },
            ],
        },
    }];

    private getItemSize (item: Item): Vector2 {
        if (isImage(item)) {
            return { x: item.image.width, y: item.image.height };
        }
        if (isShape(item)) {
            return { x: item.width, y: item.height };
        }
        throw new Error('Unknown item type');
    }

    private getArea (items: Item[]): [Vector2, Vector2] {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const item of items) {
            const size = this.getItemSize(item);
            minX = Math.min(minX, item.position.x);
            minY = Math.min(minY, item.position.y);
            maxX = Math.max(maxX, item.position.x + size.x);
            maxY = Math.max(maxY, item.position.y + size.y);
        }

        return [
            { x: minX, y: minY },
            { x: maxX - minX, y: maxY - minY },
        ];
    }

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
        const [position, size] = this.getArea(context.items);

        // Make a rectangle, move it to the bottom, and attach it to the map.
        const rect = buildShape()
            .zIndex(minZ - 1)
            .position(position)
            .width(size.x)
            .height(size.y)
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
