import React, { useMemo } from "react";
import { Superstate } from "makemd-core";
import { useMKitPreview } from "./MKitPreviewProvider";

interface MKitFrameSimplePreviewProps {
  superstate: Superstate;
  frameId?: string;
}

export const MKitFrameSimplePreview: React.FC<MKitFrameSimplePreviewProps> = ({
  superstate,
  frameId,
}) => {
  const { spaceKit, getFrameData } = useMKitPreview();

  // Get the frame to display
  const currentFrame = useMemo(() => {
    if (frameId) {
      return getFrameData(frameId);
    }

    // Try to find a root frame or the first available frame
    if (!spaceKit.frames) return null;

    for (const table of Object.values(spaceKit.frames)) {
      if (table.rows && table.rows.length > 0) {
        // Look for a frame with no parentId (root frame)
        const rootFrame = table.rows.find((row: any) => !row.parentId || row.parentId === "");
        if (rootFrame) return rootFrame;

        // Otherwise return the first frame
        return table.rows[0];
      }
    }

    return null;
  }, [frameId, spaceKit, getFrameData]);

  // Parse frame properties for display
  const frameDetails = useMemo(() => {
    if (!currentFrame) return null;

    try {
      return {
        id: currentFrame.id,
        name: currentFrame.name || currentFrame.id,
        type: currentFrame.type,
        schemaId: currentFrame.schemaId,
        props: typeof currentFrame.props === 'string'
          ? JSON.parse(currentFrame.props || '{}')
          : currentFrame.props || {},
        styles: typeof currentFrame.styles === 'string'
          ? JSON.parse(currentFrame.styles || '{}')
          : currentFrame.styles || {},
        actions: typeof currentFrame.actions === 'string'
          ? JSON.parse(currentFrame.actions || '{}')
          : currentFrame.actions || {},
      };
    } catch (e) {
      console.error("Error parsing frame data:", e);
      return null;
    }
  }, [currentFrame]);

  if (!frameDetails) {
    return (
      <div className="mk-mkit-preview-empty">
        <p>No frames found in this space kit</p>
      </div>
    );
  }

  // Render a simplified preview of the frame structure
  return (
    <div className="mk-mkit-frame-simple-preview">
      <div className="mk-frame-preview-header">
        <h3>{frameDetails.name}</h3>
        <span className="mk-frame-type">Type: {frameDetails.type}</span>
      </div>

      <div className="mk-frame-preview-content">
        {/* Props Section */}
        {Object.keys(frameDetails.props).length > 0 && (
          <div className="mk-frame-section">
            <h4>Properties</h4>
            <div className="mk-frame-props">
              {Object.entries(frameDetails.props).map(([key, value]) => (
                <div key={key} className="mk-frame-prop">
                  <span className="prop-key">{key}:</span>
                  <span className="prop-value">
                    {typeof value === 'object'
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Styles Section */}
        {Object.keys(frameDetails.styles).length > 0 && (
          <div className="mk-frame-section">
            <h4>Styles</h4>
            <div className="mk-frame-styles">
              {Object.entries(frameDetails.styles).map(([key, value]) => (
                <div key={key} className="mk-frame-style">
                  <span className="style-key">{key}:</span>
                  <span className="style-value">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Section */}
        {Object.keys(frameDetails.actions).length > 0 && (
          <div className="mk-frame-section">
            <h4>Actions</h4>
            <div className="mk-frame-actions">
              {Object.entries(frameDetails.actions).map(([key, value]) => (
                <div key={key} className="mk-frame-action">
                  <span className="action-key">{key}:</span>
                  <span className="action-value">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Representation */}
        <div className="mk-frame-section">
          <h4>Visual Preview</h4>
          <div className="mk-frame-visual">
            {renderFramePreview(frameDetails)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to render a basic visual preview based on frame type
function renderFramePreview(frame: any): React.ReactNode {
  const { type, props, styles } = frame;

  // Create inline styles from the frame styles
  const inlineStyles: React.CSSProperties = {};
  if (styles.padding) inlineStyles.padding = evaluateStyle(styles.padding);
  if (styles.margin) inlineStyles.margin = evaluateStyle(styles.margin);
  if (styles.background) inlineStyles.background = evaluateStyle(styles.background);
  if (styles.borderRadius) inlineStyles.borderRadius = evaluateStyle(styles.borderRadius);
  if (styles.width) inlineStyles.width = evaluateStyle(styles.width);
  if (styles.height) inlineStyles.height = evaluateStyle(styles.height);

  switch (type) {
    case 'text':
      return (
        <div className="frame-preview-text" style={inlineStyles}>
          {props.value || 'Text Node'}
        </div>
      );

    case 'button':
      return (
        <button className="frame-preview-button" style={inlineStyles}>
          {props.label || props.icon || 'Button'}
        </button>
      );

    case 'image':
      return (
        <div className="frame-preview-image" style={inlineStyles}>
          <div className="image-placeholder">
            🖼️ Image: {props.value || 'No source'}
          </div>
        </div>
      );

    case 'group':
    case 'container':
      return (
        <div className="frame-preview-group" style={{...inlineStyles, minHeight: '100px', border: '1px dashed var(--background-modifier-border)'}}>
          <span className="group-label">Group Container</span>
          {props.layout && <span className="layout-type">Layout: {props.layout}</span>}
        </div>
      );

    case 'list':
      return (
        <div className="frame-preview-list" style={inlineStyles}>
          <div className="list-item">• List Item 1</div>
          <div className="list-item">• List Item 2</div>
          <div className="list-item">• List Item 3</div>
        </div>
      );

    case 'flow':
      return (
        <div className="frame-preview-flow" style={inlineStyles}>
          <div className="flow-placeholder">
            📄 Flow/Note Content
          </div>
        </div>
      );

    case 'space':
      return (
        <div className="frame-preview-space" style={inlineStyles}>
          <div className="space-placeholder">
            📁 Space View
          </div>
        </div>
      );

    default:
      return (
        <div className="frame-preview-default" style={inlineStyles}>
          <span>{type} Component</span>
        </div>
      );
  }
}

// Helper to evaluate style strings (removes quotes from formula strings)
function evaluateStyle(value: any): string {
  if (typeof value === 'string') {
    // Remove surrounding quotes if it's a literal string
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    // For formulas, just return a placeholder
    if (value.startsWith('$')) {
      return 'auto';
    }
  }
  return String(value);
}