import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { NoteView } from "core/react/components/PathView/NoteView";
import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useCallback, useEffect, useState } from "react";

interface GlobalTemplateEditorProps {
  superstate: Superstate;
}

interface Template {
  name: string;
  path: string;
}

export const GlobalTemplateEditor = (props: GlobalTemplateEditorProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const templatesPath = ".space/templates";

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      // Check if templates folder exists
      const pathExists = await props.superstate.spaceManager.pathExists(templatesPath);
      
      if (pathExists) {
        // Get all files in the templates folder
        const children = await props.superstate.spaceManager.childrenForPath(templatesPath);
        const templateFiles = children
          .filter(path => path.endsWith('.md'))
          .map(path => ({
            name: path.split('/').pop()?.replace('.md', '') || '',
            path: path
          }));
        
        setTemplates(templateFiles);
      } else {
        // Create templates folder if it doesn't exist
        props.superstate.spaceManager.createSpace("templates", ".space", {});
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
    setLoading(false);
  }, [props.superstate.spaceManager, templatesPath]);

  const createTemplate = () => {
    props.superstate.ui.openModal(
      i18n.labels.createTemplate,
      <InputModal
        value=""
        saveLabel={i18n.buttons.save}
        saveValue={async (name: string) => {
          if (name.trim()) {
            try {
              // Create the template file
              const templatePath = await props.superstate.spaceManager.createItemAtPath(
                templatesPath, 
                "md", 
                name.trim(), 
                "# " + name.trim() + "\n\n"
              );
              await loadTemplates();
              setSelectedTemplate(templatePath);
            } catch (error) {
              console.error('Error creating template:', error);
            }
          }
        }}
      />,
      window
    );
  };

  const deleteTemplate = async (templatePath: string) => {
    try {
      props.superstate.spaceManager.deletePath(templatePath);
      await loadTemplates();
      if (selectedTemplate === templatePath) {
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  if (loading) {
    return <div className="mk-loading">{i18n.labels.loadingTemplates}</div>;
  }

  return (
    <div className="mk-global-template-editor">
      <div className="mk-template-sidebar">
        <div className="mk-template-header">
          <h3>{i18n.labels.globalTemplates}</h3>
          <button 
            className="mk-button-primary"
            onClick={createTemplate}
          >
            {i18n.labels.createTemplate}
          </button>
        </div>
        
        <div className="mk-template-list">
          {templates.length === 0 ? (
            <div className="mk-empty-state">
              <div className="mk-empty-state-title">{i18n.labels.noTemplatesFound}</div>
              <div className="mk-empty-state-description">{i18n.labels.createFirstTemplate}</div>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.path}
                className={`mk-template-item ${
                  selectedTemplate === template.path ? 'mk-active' : ''
                }`}
                onClick={() => setSelectedTemplate(template.path)}
              >
                <div className="mk-template-name">{template.name}</div>
                <button
                  className="mk-template-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTemplate(template.path);
                  }}
                  aria-label={i18n.menu.delete}
                >
                  <div
                    className="mk-icon-xsmall"
                    dangerouslySetInnerHTML={{
                      __html: props.superstate.ui.getSticker("ui//trash"),
                    }}
                  ></div>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mk-template-editor">
        {selectedTemplate ? (
          <NoteView
            superstate={props.superstate}
            path={selectedTemplate}
            load={true}
            forceNote={true}
          />
        ) : (
          <div className="mk-empty-state">
            <div className="mk-empty-state-title">{i18n.labels.editTemplate}</div>
            <div className="mk-empty-state-description">
              {templates.length > 0 
                ? "Select a template from the sidebar to edit it"
                : i18n.labels.createATemplateToGetStarted
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};