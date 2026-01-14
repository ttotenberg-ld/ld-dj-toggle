# LaunchDarkly Feature Flags for Strudel
# Terraform configuration for the Strudel music application
#
# Documentation: https://registry.terraform.io/providers/launchdarkly/launchdarkly/latest/docs

terraform {
  required_providers {
    launchdarkly = {
      source  = "launchdarkly/launchdarkly"
      version = "~> 2.0"
    }
  }
}

# Configure the LaunchDarkly Provider
# Set LAUNCHDARKLY_ACCESS_TOKEN environment variable or use access_token argument
provider "launchdarkly" {
  # access_token = var.launchdarkly_access_token
}

variable "project_key" {
  description = "LaunchDarkly project key"
  type        = string
  default     = "strudel"
}

variable "project_name" {
  description = "LaunchDarkly project display name"
  type        = string
  default     = "Strudel"
}

# =============================================================================
# PROJECT - Create the LaunchDarkly project if it doesn't exist
# =============================================================================
resource "launchdarkly_project" "strudel" {
  key  = var.project_key
  name = var.project_name

  tags = ["strudel", "music"]

  # Default environments created with the project
  environments {
    key   = "production"
    name  = "Production"
    color = "417505"
    tags  = ["production"]

    approval_settings {
      required                    = false
      can_review_own_request      = false
      min_num_approvals           = 1
      can_apply_declined_changes  = true
    }
  }

  environments {
    key   = "staging"
    name  = "Staging"
    color = "f5a623"
    tags  = ["staging"]
  }

  environments {
    key   = "development"
    name  = "Development"
    color = "4a90d9"
    tags  = ["development"]
  }

  default_client_side_availability {
    using_mobile_key     = true
    using_environment_id = true
  }
}

# =============================================================================
# SCALE FLAG - Musical scale selection
# =============================================================================
resource "launchdarkly_feature_flag" "scale" {
  project_key = launchdarkly_project.strudel.key
  key         = "scale"
  name        = "Scale"
  description = ""

  variation_type = "string"
  
  variations {
    value = "<g:minor>"
    name  = "G Minor"
  }
  variations {
    value = "<g:minor eb:major bb:major d:major>"
    name  = "G Minor Extended"
  }
  variations {
    value = "<g:minor*2 d:major*2>"
    name  = "G Minor D Major"
  }

  defaults {
    on_variation  = 0
    off_variation = 1
  }

  client_side_availability {
    using_mobile_key     = true
    using_environment_id = true
  }

  tags      = ["strudel"]
  temporary = true
}

# =============================================================================
# MELODY ENABLED FLAG - Toggle melody on/off
# =============================================================================
resource "launchdarkly_feature_flag" "melody_enabled" {
  project_key = launchdarkly_project.strudel.key
  key         = "melodyEnabled"
  name        = "Melody Enabled"
  description = "Toggle the melody voice on/off"

  variation_type = "boolean"

  variations {
    value = "true"
    name  = "On"
  }
  variations {
    value = "false"
    name  = "Off"
  }

  defaults {
    on_variation  = 0
    off_variation = 1
  }

  client_side_availability {
    using_mobile_key     = true
    using_environment_id = true
  }

  tags      = ["strudel"]
  temporary = false
}

# =============================================================================
# MELODY SPEED FLAG - Controls melody note density
# =============================================================================
resource "launchdarkly_feature_flag" "melody_speed" {
  project_key = launchdarkly_project.strudel.key
  key         = "melodySpeed"
  name        = "Melody Speed"
  description = "Controls melody note density. Array values create polyphonic timing (like *[16,4] in mini-notation). Single-element arrays for single speed."

  variation_type = "json"

  variations {
    value       = jsonencode([16, 4])
    name        = "Polyphonic Fast"
    description = "Fast arpeggios + slow melody layered together"
  }
  variations {
    value       = jsonencode([16])
    name        = "Fast"
    description = "16 notes per cycle - fast arpeggios"
  }
  variations {
    value       = jsonencode([8])
    name        = "Moderate"
    description = "8 notes per cycle - moderate speed"
  }
  variations {
    value       = jsonencode([8, 2])
    name        = "Polyphonic Moderate"
    description = "Moderate + sparse layered together"
  }
  variations {
    value       = jsonencode([4])
    name        = "Slow"
    description = "4 notes per cycle - slow"
  }
  variations {
    value = jsonencode([16, 4, 2])
    name  = "Full Polyphony"
  }

  defaults {
    on_variation  = 0
    off_variation = 1
  }

  client_side_availability {
    using_mobile_key     = true
    using_environment_id = true
  }

  tags      = ["music", "strudel"]
  temporary = false
}

# =============================================================================
# LEAD SYNTH SETTINGS FLAG - Controls lead synthesizer sound
# =============================================================================
resource "launchdarkly_feature_flag" "lead_synth_settings" {
  project_key = launchdarkly_project.strudel.key
  key         = "leadSynthSettings"
  name        = "Lead Synth Settings"
  description = "Controls the lead synthesizer sound and filter settings for Strudel patterns"

  variation_type = "json"

  variations {
    value = jsonencode({
      gain  = 1
      lpf   = 300
      lpq   = 0
      sound = "sawtooth"
    })
    name        = "Sawtooth Lead"
    description = "Classic sawtooth lead"
  }
  variations {
    value = jsonencode({
      gain  = 0.8
      lpf   = 3000
      lpq   = 0
      sound = "gm_lead_2_sawtooth"
    })
    name        = "GM Sawtooth Lead"
    description = "General MIDI Sawtooth Lead"
  }
  variations {
    value = jsonencode({
      gain  = 0.7
      lpf   = 2000
      lpq   = 2
      sound = "supersaw"
    })
    name        = "Supersaw"
    description = "Detuned supersaw - great for EDM"
  }
  variations {
    value = jsonencode({
      gain  = 0.8
      lpf   = 1000
      lpq   = 5
      sound = "square"
    })
    name        = "Square Lead"
    description = "Square wave with resonance"
  }

  defaults {
    on_variation  = 0
    off_variation = 0
  }

  client_side_availability {
    using_mobile_key     = true
    using_environment_id = true
  }

  tags      = ["audio", "instruments", "strudel"]
  temporary = false
}

# =============================================================================
# LEAD ENABLED FLAG - Toggle lead synth on/off
# =============================================================================
resource "launchdarkly_feature_flag" "lead_enabled" {
  project_key = launchdarkly_project.strudel.key
  key         = "leadEnabled"
  name        = "Lead Enabled"
  description = "Toggle the lead synth voice on/off"

  variation_type = "boolean"

  variations {
    value = "true"
    name  = "On"
  }
  variations {
    value = "false"
    name  = "Off"
  }

  defaults {
    on_variation  = 0
    off_variation = 1
  }

  client_side_availability {
    using_mobile_key     = true
    using_environment_id = true
  }

  tags      = ["strudel"]
  temporary = false
}

# =============================================================================
# BASS ENABLED FLAG - Toggle bass on/off
# =============================================================================
resource "launchdarkly_feature_flag" "bass_enabled" {
  project_key = launchdarkly_project.strudel.key
  key         = "bassEnabled"
  name        = "Bass Enabled"
  description = "Toggle the bass voice on/off"

  variation_type = "boolean"

  variations {
    value = "true"
    name  = "On"
  }
  variations {
    value = "false"
    name  = "Off"
  }

  defaults {
    on_variation  = 0
    off_variation = 1
  }

  client_side_availability {
    using_mobile_key     = true
    using_environment_id = true
  }

  tags      = ["strudel"]
  temporary = false
}

# =============================================================================
# DRUM KIT SETTINGS FLAG - Controls drum kit sound
# =============================================================================
resource "launchdarkly_feature_flag" "drum_kit_settings" {
  project_key = launchdarkly_project.strudel.key
  key         = "drumKitSettings"
  name        = "Drum Kit Settings"
  description = ""

  variation_type = "json"

  variations {
    value = jsonencode({
      bank = "RolandTR808"
    })
    name = "Start here - 808"
  }
  variations {
    value = jsonencode({
      bank = "RolandTR909"
    })
    name = "Next up - 909"
  }
  variations {
    value = jsonencode({
      bank  = "RolandTR909"
      delay = 0.2
      gain  = 1.1
      room  = 0.3
    })
    name = "Spice it up"
  }

  defaults {
    on_variation  = 0
    off_variation = 1
  }

  client_side_availability {
    using_mobile_key     = true
    using_environment_id = true
  }

  tags      = ["strudel"]
  temporary = true
}

# =============================================================================
# DRUMS ENABLED FLAG - Toggle drums on/off
# =============================================================================
resource "launchdarkly_feature_flag" "drums_enabled" {
  project_key = launchdarkly_project.strudel.key
  key         = "drumsEnabled"
  name        = "Drums Enabled"
  description = "Toggle the drums voice on/off"

  variation_type = "boolean"

  variations {
    value = "true"
    name  = "On"
  }
  variations {
    value = "false"
    name  = "Off"
  }

  defaults {
    on_variation  = 0
    off_variation = 1
  }

  client_side_availability {
    using_mobile_key     = true
    using_environment_id = true
  }

  tags      = ["strudel"]
  temporary = false
}

# =============================================================================
# OUTPUTS
# =============================================================================
output "project_key" {
  description = "The LaunchDarkly project key"
  value       = launchdarkly_project.strudel.key
}

output "project_id" {
  description = "The LaunchDarkly project ID"
  value       = launchdarkly_project.strudel.id
}

output "environment_keys" {
  description = "List of environment keys in the project"
  value       = [for env in launchdarkly_project.strudel.environments : env.key]
}

output "flag_keys" {
  description = "List of all created feature flag keys"
  value = [
    launchdarkly_feature_flag.scale.key,
    launchdarkly_feature_flag.melody_enabled.key,
    launchdarkly_feature_flag.melody_speed.key,
    launchdarkly_feature_flag.lead_synth_settings.key,
    launchdarkly_feature_flag.lead_enabled.key,
    launchdarkly_feature_flag.bass_enabled.key,
    launchdarkly_feature_flag.drum_kit_settings.key,
    launchdarkly_feature_flag.drums_enabled.key,
  ]
}

