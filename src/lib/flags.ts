import { dedupe, flag } from 'flags/next';
import type { Identify } from 'flags';
import { growthbookAdapter, type Attributes } from '@flags-sdk/growthbook';

const identify = dedupe((async ({ cookies }) => {
  const userId = cookies.get('user_id')?.value;

  return {
    id: userId,
    // Add additional targeting attributes here as needed.
  };
}) satisfies Identify<Attributes>);

export const exampleFlag = flag({
  key: 'example_flag',
  identify,
  adapter: growthbookAdapter.feature<boolean>(),
  defaultValue: false,
});
