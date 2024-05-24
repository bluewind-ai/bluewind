// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main() {
  return [{
    name: 'is_email_valid',
    label: 'Is Email Valid',
    type: 'bool',
    fieldType: 'booleancheckbox',
    groupName: 'emailinformation',
    "options": [
      {
        "label": "Yes",
        "value": "true"
      },
      {
        "label": "No",
        "value": "false"
      }
    ]
  },
  {
    name: 'is_catch_all',
    label: 'Is Catchall',
    type: 'bool',
    fieldType: 'booleancheckbox',
    groupName: 'emailinformation',
    "options": [
      {
        "label": "Yes",
        "value": "true"
      },
      {
        "label": "No",
        "value": "false"
      }
    ]
  },
  {
    name: 'enrichment_pipeline_finished',
    label: 'Enrichment Pipeline finished',
    type: 'bool',
    fieldType: 'booleancheckbox',
    groupName: 'contactinformation',
    "options": [
      {
        "label": "Yes",
        "value": "true"
      },
      {
        "label": "No",
        "value": "false"
      }
    ]
  }
  ]
}