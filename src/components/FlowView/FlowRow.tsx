import { FlowEditor, FlowEditorParent } from 'components/FlowEditor/FlowEditor';
import dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime'
import MakeMDPlugin from 'main';
import { TAbstractFile, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import React, { useEffect, useRef, useState } from 'react'
import { openFile, unifiedToNative } from 'utils/utils';
import { FolderObject } from './FlowComponent';
import { spawnPortal } from 'utils/flowEditor';
import { uiIconSet } from 'utils/icons';
dayjs.extend(require('dayjs/plugin/relativeTime'))
interface FileRowProps {
    item: FolderObject;
    plugin: MakeMDPlugin
}

export const FlowRow = (props: FileRowProps) => {
    const ref = useRef<HTMLDivElement>(null);
  const [flowOpen, setFlowOpen] = useState(false);
    const loadFile = () => {
        const file = props.item.file;
        const div = ref.current;
        const newLeaf = spawnPortal(props.plugin, div);
        newLeaf.openFile(file as TFile);
    }

    const toggleFlow = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        const newState = !flowOpen
        if (newState) {
            loadFile();
        } else {
            ref.current.empty();
        }
        setFlowOpen(newState);
    }
    const {item} = props

    return <div className='mk-flowspace-container'>
        <div className='mk-flowspace-title' onClick={(e) => 
        //@ts-ignore
        openFile({ ...props.item.file, isFolder: item.type == 'folder' }, props.plugin.app, false)}>
            <div dangerouslySetInnerHTML={item.icon ?? item.type == 'folder' ? 
               {__html: uiIconSet['mk-ui-folder']} : {__html: uiIconSet['mk-ui-file']}}>
        { item.icon && unifiedToNative(item.icon[1]) }</div><div>
<p>{item.name}</p>
<p className='mk-flowspace-date'>{item.created && dayjs(item.created).fromNow()}</p>
</div> <span></span>

<button onClick={toggleFlow} className={flowOpen ? 'mk-open' : ''}  dangerouslySetInnerHTML={{__html: uiIconSet['mk-ui-flow-hover']}}>
        </button>
        </div>
        <div className='mk-flowspace-editor' ref={ref}></div>
        </div>
}