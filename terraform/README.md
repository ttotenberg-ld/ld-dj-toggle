# LaunchDarkly Terraform Configuration for Strudel

This Terraform configuration creates a LaunchDarkly project and feature flags for the Strudel music application.

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) installed (v1.0+)
2. A LaunchDarkly account with API access
3. A LaunchDarkly access token with write permissions

## What Gets Created

### Project

A LaunchDarkly project with three environments:
- **Production** (green) - Main production environment
- **Staging** (orange) - Pre-production testing
- **Development** (blue) - Development/local testing

### Feature Flags

| Flag Key | Type | Description |
|----------|------|-------------|
| `scale` | String | Musical scale selection (e.g., `<g:minor>`) |
| `melodyEnabled` | Boolean | Toggle the melody voice on/off |
| `melodySpeed` | JSON | Controls melody note density with polyphonic options |
| `leadSynthSettings` | JSON | Lead synthesizer sound and filter settings |
| `leadEnabled` | Boolean | Toggle the lead synth voice on/off |
| `bassEnabled` | Boolean | Toggle the bass voice on/off |
| `drumKitSettings` | JSON | Drum kit bank and effect settings |
| `drumsEnabled` | Boolean | Toggle the drums voice on/off |

## Usage

### 1. Set up authentication

Set your LaunchDarkly access token as an environment variable:

```bash
export LAUNCHDARKLY_ACCESS_TOKEN="your-api-access-token"
```

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

### 3. Preview changes

```bash
terraform plan
```

Or with custom project key:

```bash
terraform plan -var="project_key=my-strudel-project" -var="project_name=My Strudel Project"
```

### 4. Apply changes

```bash
terraform apply
```

## Configuration

### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `project_key` | LaunchDarkly project key | `strudel` |
| `project_name` | LaunchDarkly project display name | `Strudel` |

### Customizing the Project

To use a different project key, either:

1. Pass it as a variable:
   ```bash
   terraform apply -var="project_key=my-strudel" -var="project_name=My Strudel"
   ```

2. Create a `terraform.tfvars` file:
   ```hcl
   project_key  = "my-strudel"
   project_name = "My Strudel"
   ```

## Importing Existing Resources

If the project or flags already exist in LaunchDarkly, you can import them:

```bash
# Import existing project
terraform import launchdarkly_project.strudel strudel

# Import existing flags
terraform import launchdarkly_feature_flag.scale strudel/scale
terraform import launchdarkly_feature_flag.melody_enabled strudel/melodyEnabled
terraform import launchdarkly_feature_flag.melody_speed strudel/melodySpeed
terraform import launchdarkly_feature_flag.lead_synth_settings strudel/leadSynthSettings
terraform import launchdarkly_feature_flag.lead_enabled strudel/leadEnabled
terraform import launchdarkly_feature_flag.bass_enabled strudel/bassEnabled
terraform import launchdarkly_feature_flag.drum_kit_settings strudel/drumKitSettings
terraform import launchdarkly_feature_flag.drums_enabled strudel/drumsEnabled
```

## Flag Details

### Scale Flag
A multivariate string flag with musical scale patterns in Strudel mini-notation:
- `<g:minor>` - Single G minor scale
- `<g:minor eb:major bb:major d:major>` - Progression through multiple scales
- `<g:minor*2 d:major*2>` - Alternating pattern

### Melody Speed Flag
JSON arrays that create polyphonic timing patterns:
- `[16, 4]` - Fast arpeggios + slow melody layered
- `[16]` - 16 notes per cycle (fast)
- `[8]` - 8 notes per cycle (moderate)
- `[8, 2]` - Moderate + sparse
- `[4]` - 4 notes per cycle (slow)
- `[16, 4, 2]` - Full polyphony

### Lead Synth Settings
JSON objects controlling synth parameters:
- `sound` - Oscillator type (sawtooth, supersaw, square, etc.)
- `gain` - Volume level
- `lpf` - Low-pass filter frequency
- `lpq` - Filter resonance

### Drum Kit Settings
JSON objects for drum configuration:
- `bank` - Sample bank (RolandTR808, RolandTR909)
- `delay`, `room`, `gain` - Effect parameters

## Outputs

After applying, Terraform will output:
- `project_key` - The created project key
- `project_id` - The created project ID
- `environment_keys` - List of environment keys
- `flag_keys` - List of all feature flag keys

## Destroying Resources

To remove all resources created by this configuration:

```bash
terraform destroy
```

⚠️ **Warning**: This will delete the project and all flags permanently!

## Resources

- [LaunchDarkly Terraform Provider Docs](https://registry.terraform.io/providers/launchdarkly/launchdarkly/latest/docs)
- [LaunchDarkly Project Resource](https://registry.terraform.io/providers/launchdarkly/launchdarkly/latest/docs/resources/project)
- [LaunchDarkly Feature Flag Resource](https://registry.terraform.io/providers/launchdarkly/launchdarkly/latest/docs/resources/feature_flag)
