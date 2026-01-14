# strudel-ld

A **modified version** of [Strudel](https://strudel.cc/) with **LaunchDarkly integration** for dynamic, real-time control of live coding patterns.

---

## Running Locally

After cloning the project, you can run the REPL locally:

1. Install [Node.js](https://nodejs.org/) 18 or newer
2. Install [pnpm](https://pnpm.io/installation)
3. Install dependencies:
   ```bash
   pnpm i
   ```
4. Set up your LaunchDarkly client ID (optional, for flag integration):
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and replace `your-client-id-here` with your actual LaunchDarkly Client-side ID.

5. Run the development server:
   ```bash
   pnpm dev
   ```

---

## LaunchDarkly Integration

This fork adds feature flag support to Strudel, enabling you to dynamically control musical parameters like tempo, effects, filters, and toggle entire voices on/off—all without restarting your loops.

**📖 See the full integration guide:** [LAUNCHDARKLY_INTEGRATION_GUIDE.md](./LAUNCHDARKLY_INTEGRATION_GUIDE.md)

### Quick Example

```javascript
// Control melody speed with a flag (supports polyphonic layering)
$: n("<0 2 0 3 4 0 9 8>")
  .polySpeed('melodySpeed', 16)
  .scale(flag('scale', '<g:minor>'))
  .toggle('melodyEnabled', true)
  ._punchcard()
```

### Terraform Setup

This project includes Terraform configuration for provisioning LaunchDarkly flags. See [`terraform/`](./terraform/) for the infrastructure-as-code setup.

**Flags defined in Terraform:**
| Flag Key | Type | Description |
|----------|------|-------------|
| `scale` | String | Musical scale (supports mini-notation) |
| `melodySpeed` | JSON | Melody note density array |
| `melodyEnabled` | Boolean | Toggle melody voice |
| `leadSynthSettings` | JSON | Lead synth configuration |
| `leadEnabled` | Boolean | Toggle lead synth |
| `bassEnabled` | Boolean | Toggle bass voice |
| `drumKitSettings` | JSON | Drum kit configuration |
| `drumsEnabled` | Boolean | Toggle drums |

---

## Using Strudel In Your Project

This project is organized into many [packages](./packages), which are also available on [npm](https://www.npmjs.com/search?q=%40strudel).

Read more about how to use these in your own project [here](https://strudel.cc/technical-manual/project-start).

You will need to abide by the terms of the [GNU Affero Public License v3](LICENSE). Strudel code can only be shared within free/open source projects under the same license—see the license for details.

---

## About Strudel

Strudel is a live coding environment for music on the web.

- **Website:** [strudel.cc](https://strudel.cc)
- **Documentation:** [strudel.cc/learn](https://strudel.cc/learn)
- **Original Repository:** [codeberg.org/uzu/strudel](https://codeberg.org/uzu/strudel)
- **Technical Blog Post:** [loophole-letters.vercel.app/strudel](https://loophole-letters.vercel.app/strudel)
- **1 Year of Strudel:** [loophole-letters.vercel.app/strudel1year](https://loophole-letters.vercel.app/strudel1year)
- **2 Years of Strudel:** [strudel.cc/blog/#year-2](https://strudel.cc/blog/#year-2)

---

## Contributing

There are many ways to contribute to this project! See the [contribution guide](./CONTRIBUTING.md). You can find the full list of original Strudel contributors [here](https://codeberg.org/uzu/strudel/activity/contributors).

---

## Community

There is a #strudel channel on the TidalCycles discord: [discord.com/invite/HGEdXmRkzT](https://discord.com/invite/HGEdXmRkzT)

You can also ask questions and find related discussions on the tidal club forum: [club.tidalcycles.org](https://club.tidalcycles.org/)

The discord and forum is shared with the Haskell (Tidal) and Python (Vortex) siblings of this project.

Mastodon: [@strudel@social.toplap.org](https://social.toplap.org/@strudel)

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**, the same license as the original Strudel project.

As required by the AGPL-3.0:
- This is a **modified version** of Strudel
- The complete source code is available in this repository
- Any derivative works must also be licensed under AGPL-3.0
- If you deploy this as a network service, you must provide access to the source code

See the [LICENSE](./LICENSE) file for the full license text.

Licensing info for the default sound banks can be found in the [dough-samples](https://github.com/felixroos/dough-samples/blob/main/README.md) repository.

---

## Attribution

This project is a fork of **Strudel** — a live coding environment for music created by [Felix Roos](https://github.com/felixroos) and the [Strudel contributors](https://codeberg.org/uzu/strudel/activity/contributors).

- **Original Project:** [Strudel on Codeberg](https://codeberg.org/uzu/strudel)
- **Original Website:** [strudel.cc](https://strudel.cc/)
- **Modification Date:** December 2024
- **Modifications:** Added LaunchDarkly feature flag integration for real-time parameter control

We are grateful to the Strudel community for creating such an excellent live coding platform.
