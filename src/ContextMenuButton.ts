import OBR, { ContextMenuContext, ContextMenuIcon, ContextMenuItem, Item } from '@owlbear-rodeo/sdk';
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
                { key: 'layer', value: 'MAP' },
            ],
        },
    }];

    async onClick (context: ContextMenuContext, elementId: string): Promise<void> {
        // Work out what z-index to use.
        const items = await OBR.scene.items.getItems((i: Item) => i.layer === 'MAP');
        const minZ = Math.min(...items.map((i) => i.zIndex));

        // Move this item to the bottom of the map layer.
        OBR.scene.items.updateItems(context.items, (items) => {
            items[0].zIndex = minZ - 1;
        });
    }
}
