// Fetch-only script, no imports allowed (except windmill) but benefits from a dedicated highly efficient runtime
//import * as wmill from './windmill.ts'

export async function main(edit_at: string, twenty_last_migrated_at_iso_8601: string) {
  return {
    edit_at: new Date(edit_at).getTime(),
    twenty_last_migrated_at_iso_8601: new Date(twenty_last_migrated_at_iso_8601).getTime()
  }
}
