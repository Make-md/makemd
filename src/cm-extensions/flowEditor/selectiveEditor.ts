import { EditorState, Extension, Transaction, Annotation, StateField, RangeSetBuilder } from "@codemirror/state";
import { EditorView, Decoration, DecorationSet, } from "@codemirror/view";
import { getAvailableRanges } from "range-analyzer";

export const editableRange = Annotation.define<[number | undefined, number | undefined]>();
export const hiddenLine = Decoration.replace({inclusive: true})

//partial note editor

export const hideLine = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(value, tr) {
    let builder = new RangeSetBuilder<Decoration>()

    if (tr.state.field(selectiveLinesFacet)?.[0] != undefined) {
        builder.add(tr.state.doc.line(1).from, 
        tr.state.doc.line(tr.state.field(selectiveLinesFacet)[0]).from, hiddenLine);
        builder.add(tr.state.doc.line(tr.state.field(selectiveLinesFacet)[1]).to, 
        tr.state.doc.line(tr.newDoc.lines).to, hiddenLine);
    }
    const dec = builder.finish()
    return dec;
  },
  provide: f => EditorView.decorations.from(f)
})


 export const selectiveLinesFacet = StateField.define<[number | undefined, number | undefined]>({
  create: () => [undefined, undefined],
 update(value, tr) {
   if (tr.annotation(editableRange)) {
    if (tr.annotation(editableRange)[0]) {
      return [tr.annotation(editableRange)[0], Math.min(tr.state.doc.lines, tr.annotation(editableRange)[1])];
    }
   return tr.annotation(editableRange)
   }
   return value;
 },

})

export const lineRangeToPosRange = (state: EditorState, range: [number, number]) => {
  return {
    from: state.doc.line(range[0]).from,
    to: state.doc.line(range[1]+1).from,
  }
}

export const smartDelete = EditorState.transactionFilter.of((tr:Transaction) => {
    if(tr.isUserEvent('delete') && !tr.isUserEvent('delete.smart')){

      const initialSelections = tr.startState.selection.ranges.map(range => ({ 
        from: range.from,
        to: range.to
      }))
  
    if(initialSelections.length > 0 && tr.startState.field(selectiveLinesFacet)?.[0]) 
    { 
      const posRange = lineRangeToPosRange(tr.startState, tr.startState.field(selectiveLinesFacet));
     
      tr.startState.update(
          {
              changes:{
                  from:Math.max(posRange.from, initialSelections[0].from),
                  to:Math.min(posRange.to, initialSelections[0].to),
                },
            annotations: Transaction.userEvent.of(`${tr.annotation(Transaction.userEvent)}.smart`)
        });
    }

  }
  return tr;
  
  })

 export const preventModifyTargetRanges = EditorState.transactionFilter.of((tr:Transaction) => {

let newTrans = [];
    try{
      const selectiveLines = tr.startState.field(selectiveLinesFacet)
      
    
    if (tr.isUserEvent('input') || tr.isUserEvent('delete') || tr.isUserEvent('move')) {
      if (selectiveLines?.[0]) {
        const posRange = lineRangeToPosRange(tr.startState, tr.startState.field(selectiveLinesFacet));
        if (tr.changes.touchesRange(0, posRange.from-1) || !tr.changes.touchesRange(posRange.from, posRange.to)) {
          return [];
        }
      }
    }
      if (tr.state.doc.lines != tr.startState.doc.lines) {
        
        
        const numberNewLines = tr.state.doc.lines-tr.startState.doc.lines;
        if (selectiveLines?.[0]) {
          const posRange = lineRangeToPosRange(tr.startState, tr.startState.field(selectiveLinesFacet));
          if (tr.changes.touchesRange(0, posRange.from-1)) {
            newTrans.push(
              {
                annotations: [editableRange.of([selectiveLines[0]+numberNewLines, selectiveLines[1]+numberNewLines])]
            })
          } else 
          if (tr.changes.touchesRange(posRange.from-1, posRange.to)) {
            newTrans.push( 
              {
                annotations: [editableRange.of([selectiveLines[0], selectiveLines[1]+numberNewLines])]
            });
          }
        }
      }
  
  
}
catch(e){
    return [];
}
return [tr, ...newTrans];
  });

  export const smartPaste = (getReadOnlyRanges:(targetState:EditorState)=>Array<{from:number|undefined, to:number|undefined}>) => EditorView.domEventHandlers({
        
    paste(event, view)
    {

      const clipboardData = event.clipboardData || (window as any).clipboardData;
      const pastedData = clipboardData.getData('Text');
      const initialSelections = view.state.selection.ranges.map(range => ({ 
          from: range.from,
          to: range.to
        }));
      
      if(initialSelections.length > 0)
      { 
        const readOnlyRanges = getReadOnlyRanges(view.state);  
        const result = getAvailableRanges(readOnlyRanges, initialSelections[0], {from: 0, to: view.state.doc.line(view.state.doc.lines).to}) as Array<{from:number, to:number}>;
        if(result.length > 0)
        {
          view.dispatch(
            {
              changes:{
                  from: result[0].from, 
                  to: result[0].to, 
                  insert: pastedData 
                },
              annotations: Transaction.userEvent.of(`input.paste.smart`)
            })
        }
      }
    }
    
  })


  const readOnlyRangesExtension = [smartDelete, preventModifyTargetRanges];
  export const editBlockExtensions = () => [readOnlyRangesExtension, hideLine, selectiveLinesFacet]
  export default readOnlyRangesExtension;