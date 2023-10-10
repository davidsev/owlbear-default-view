import OBR from '@owlbear-rodeo/sdk';
import { ContextMenuButton } from './ContextMenuButton';

export function initBackground () {
    OBR.onReady(async () => {
        // Set up the context menu.
        OBR.contextMenu.create(new ContextMenuButton());
    });
}



