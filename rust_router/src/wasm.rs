use crate::obstacle_map::GridObstacleMap;
use crate::router::GridRouter;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SimpleRouteJson {
    layer_count: Option<usize>,
    obstacles: Vec<Obstacle>,
    connections: Vec<SimpleRouteConnection>,
    bounds: Bounds,
    min_trace_width: Option<NumberOrString>,
    nominal_trace_width: Option<NumberOrString>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Bounds {
    min_x: f64,
    max_x: f64,
    min_y: f64,
    max_y: f64,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Obstacle {
    #[serde(rename = "type", default)]
    obstacle_type: Option<String>,
    center: Point2,
    width: f64,
    height: f64,
    #[serde(default)]
    layers: Vec<String>,
    #[serde(default)]
    layer: Option<String>,
    #[serde(default)]
    connected_to: Vec<String>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SimpleRouteConnection {
    name: String,
    #[serde(default)]
    source_trace_id: Option<String>,
    points_to_connect: Vec<RoutePoint>,
    #[serde(default)]
    width: Option<NumberOrString>,
    #[serde(default)]
    nominal_trace_width: Option<NumberOrString>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RoutePoint {
    x: f64,
    y: f64,
    #[serde(default)]
    layer: Option<String>,
    #[serde(default)]
    point_id: Option<String>,
    #[serde(default)]
    pcb_port_id: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
struct Point2 {
    x: f64,
    y: f64,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
enum NumberOrString {
    Number(f64),
    String(String),
}

impl NumberOrString {
    fn as_f64(&self) -> Option<f64> {
        match self {
            Self::Number(value) => Some(*value),
            Self::String(value) => value.parse::<f64>().ok(),
        }
    }
}

#[derive(Debug, Serialize)]
struct SimplifiedPcbTrace {
    #[serde(rename = "type")]
    trace_type: &'static str,
    pcb_trace_id: String,
    connection_name: String,
    route: Vec<RouteSegment>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "route_type", rename_all = "snake_case")]
enum RouteSegment {
    Wire {
        x: f64,
        y: f64,
        layer: String,
        width: f64,
    },
    Via {
        x: f64,
        y: f64,
        from_layer: String,
        to_layer: String,
    },
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WasmRouterOptions {
    #[serde(default = "default_grid_step")]
    grid_step: f64,
    #[serde(default = "default_clearance")]
    clearance: f64,
    #[serde(default = "default_max_iterations")]
    max_iterations: u32,
    #[serde(default = "default_via_cost")]
    via_cost: i32,
    #[serde(default = "default_h_weight")]
    h_weight: f32,
    #[serde(default = "default_turn_cost")]
    turn_cost: i32,
    #[serde(default)]
    track_margin: i32,
    #[serde(default)]
    layer_costs: Option<Vec<i32>>,
    #[serde(default)]
    layer_direction_preferences: Option<Vec<u8>>,
    #[serde(default)]
    direction_preference_cost: i32,
}

impl Default for WasmRouterOptions {
    fn default() -> Self {
        Self {
            grid_step: default_grid_step(),
            clearance: default_clearance(),
            max_iterations: default_max_iterations(),
            via_cost: default_via_cost(),
            h_weight: default_h_weight(),
            turn_cost: default_turn_cost(),
            track_margin: 0,
            layer_costs: None,
            layer_direction_preferences: None,
            direction_preference_cost: 0,
        }
    }
}

fn default_grid_step() -> f64 {
    0.1
}

fn default_clearance() -> f64 {
    0.2
}

fn default_max_iterations() -> u32 {
    300_000
}

fn default_via_cost() -> i32 {
    50_000
}

fn default_h_weight() -> f32 {
    1.25
}

fn default_turn_cost() -> i32 {
    1_000
}

#[wasm_bindgen(js_name = routeSimpleRouteJson)]
pub fn route_simple_route_json(input: JsValue, options: JsValue) -> Result<JsValue, JsValue> {
    let input: SimpleRouteJson = serde_wasm_bindgen::from_value(input)
        .map_err(|error| JsValue::from_str(&format!("Invalid SimpleRouteJson: {error}")))?;
    let options: WasmRouterOptions = if options.is_undefined() || options.is_null() {
        WasmRouterOptions::default()
    } else {
        serde_wasm_bindgen::from_value(options)
            .map_err(|error| JsValue::from_str(&format!("Invalid router options: {error}")))?
    };

    if options.grid_step <= 0.0 {
        return Err(JsValue::from_str("gridStep must be greater than zero"));
    }

    let traces = route_simple_route_json_inner(&input, &options)?;
    serde_wasm_bindgen::to_value(&traces)
        .map_err(|error| JsValue::from_str(&format!("Could not serialize routes: {error}")))
}

fn route_simple_route_json_inner(
    input: &SimpleRouteJson,
    options: &WasmRouterOptions,
) -> Result<Vec<SimplifiedPcbTrace>, JsValue> {
    let layer_count = input.layer_count.unwrap_or(2).max(1);
    if layer_count > u8::MAX as usize {
        return Err(JsValue::from_str("layerCount must fit in u8"));
    }

    let layer_names = get_layer_names(layer_count);
    let mut routed_cells: Vec<(i32, i32, u8)> = Vec::new();
    let mut traces = Vec::new();

    for (connection_index, connection) in input.connections.iter().enumerate() {
        if connection.points_to_connect.len() < 2 {
            continue;
        }

        let width = get_trace_width(input, connection);
        let route_margin = options
            .track_margin
            .max(clearance_radius(width, options.clearance, options.grid_step));
        let connection_ids = get_connection_ids(connection);
        let mut full_path: Vec<(i32, i32, u8)> = Vec::new();

        for segment_index in 0..(connection.points_to_connect.len() - 1) {
            let start = &connection.points_to_connect[segment_index];
            let end = &connection.points_to_connect[segment_index + 1];
            let mut obstacles = build_obstacle_map(
                input,
                options,
                layer_count,
                &connection_ids,
                &routed_cells,
                route_margin,
            );

            let sources = point_states(start, layer_count, &layer_names, options.grid_step);
            let targets = point_states(end, layer_count, &layer_names, options.grid_step);
            let endpoint_positions = endpoint_positions(&sources, &targets);

            obstacles.clear_source_target_cells();
            obstacles.clear_allowed_cells();
            obstacles.set_endpoint_exempt(endpoint_positions, route_margin.max(1));

            for &(gx, gy, layer) in sources.iter().chain(targets.iter()) {
                obstacles.add_source_target_cell(gx, gy, layer as usize);
                obstacles.add_allowed_cell(gx, gy);
            }

            let router = GridRouter::new_core(
                options.via_cost,
                options.h_weight,
                Some(options.turn_cost),
                Some(1),
                0,
                0,
                options.layer_costs.clone(),
                None,
                options.layer_direction_preferences.clone(),
                options.direction_preference_cost,
                0,
                0,
            );

            let (path, _iterations, _stats) = router.route_multi_core(
                &obstacles,
                sources,
                targets,
                options.max_iterations,
                false,
                0,
                None,
                None,
                2,
                route_margin,
            );

            let path = path.ok_or_else(|| {
                JsValue::from_str(&format!(
                    "KRT GridRouter found no route for connection {} segment {}",
                    connection.name, segment_index
                ))
            })?;

            if segment_index == 0 {
                full_path.extend(path);
            } else {
                full_path.extend(path.into_iter().skip(1));
            }
        }

        routed_cells.extend(full_path.iter().copied());

        traces.push(SimplifiedPcbTrace {
            trace_type: "pcb_trace",
            pcb_trace_id: connection
                .source_trace_id
                .clone()
                .unwrap_or_else(|| format!("kicad_rust_wasm_trace_{connection_index}")),
            connection_name: connection.name.clone(),
            route: grid_path_to_route(&full_path, options.grid_step, width, &layer_names),
        });
    }

    Ok(traces)
}

fn build_obstacle_map(
    input: &SimpleRouteJson,
    options: &WasmRouterOptions,
    layer_count: usize,
    connection_ids: &[String],
    routed_cells: &[(i32, i32, u8)],
    route_margin: i32,
) -> GridObstacleMap {
    let mut obstacles = GridObstacleMap::new(layer_count);
    let min_gx = to_grid(input.bounds.min_x, options.grid_step);
    let max_gx = to_grid(input.bounds.max_x, options.grid_step);
    let min_gy = to_grid(input.bounds.min_y, options.grid_step);
    let max_gy = to_grid(input.bounds.max_y, options.grid_step);

    for obstacle in &input.obstacles {
        if obstacle
            .connected_to
            .iter()
            .any(|id| connection_ids.iter().any(|connection_id| connection_id == id))
        {
            continue;
        }

        if !obstacle
            .obstacle_type
            .as_deref()
            .map(|value| value == "rect")
            .unwrap_or(true)
        {
            continue;
        }

        let half_width = obstacle.width / 2.0 + options.clearance;
        let half_height = obstacle.height / 2.0 + options.clearance;
        let obs_min_gx = to_grid(obstacle.center.x - half_width, options.grid_step).max(min_gx);
        let obs_max_gx = to_grid(obstacle.center.x + half_width, options.grid_step).min(max_gx);
        let obs_min_gy = to_grid(obstacle.center.y - half_height, options.grid_step).max(min_gy);
        let obs_max_gy = to_grid(obstacle.center.y + half_height, options.grid_step).min(max_gy);

        for layer in obstacle_layers(obstacle, layer_count) {
            for gx in obs_min_gx..=obs_max_gx {
                for gy in obs_min_gy..=obs_max_gy {
                    obstacles.add_blocked_cell(gx, gy, layer);
                }
            }
        }
    }

    for &(gx, gy, layer) in routed_cells {
        reserve_cell_halo(&mut obstacles, gx, gy, layer as usize, route_margin);
    }

    add_board_bounds(&mut obstacles, min_gx, max_gx, min_gy, max_gy);

    obstacles
}

fn add_board_bounds(
    obstacles: &mut GridObstacleMap,
    min_gx: i32,
    max_gx: i32,
    min_gy: i32,
    max_gy: i32,
) {
    let far_min = i32::MIN / 4;
    let far_max = i32::MAX / 4;
    obstacles.set_bga_zone(far_min, far_min, min_gx - 1, far_max);
    obstacles.set_bga_zone(max_gx + 1, far_min, far_max, far_max);
    obstacles.set_bga_zone(min_gx, far_min, max_gx, min_gy - 1);
    obstacles.set_bga_zone(min_gx, max_gy + 1, max_gx, far_max);
}

fn reserve_cell_halo(
    obstacles: &mut GridObstacleMap,
    gx: i32,
    gy: i32,
    layer: usize,
    radius: i32,
) {
    for dx in -radius..=radius {
        for dy in -radius..=radius {
            obstacles.add_blocked_cell(gx + dx, gy + dy, layer);
        }
    }
}

fn obstacle_layers(obstacle: &Obstacle, layer_count: usize) -> Vec<usize> {
    let mut layers = Vec::new();

    for layer in &obstacle.layers {
        if let Some(index) = layer_to_index(layer, layer_count) {
            layers.push(index);
        }
    }

    if layers.is_empty() {
        if let Some(index) = obstacle
            .layer
            .as_deref()
            .and_then(|layer| layer_to_index(layer, layer_count))
        {
            layers.push(index);
        }
    }

    if layers.is_empty() {
        return (0..layer_count).collect();
    }

    layers.sort_unstable();
    layers.dedup();
    layers
}

fn point_states(
    point: &RoutePoint,
    layer_count: usize,
    layer_names: &[String],
    grid_step: f64,
) -> Vec<(i32, i32, u8)> {
    let gx = to_grid(point.x, grid_step);
    let gy = to_grid(point.y, grid_step);

    if let Some(layer) = point.layer.as_deref() {
        if let Some(index) = layer_names.iter().position(|name| name == layer) {
            return vec![(gx, gy, index as u8)];
        }
        if let Some(index) = layer_to_index(layer, layer_count) {
            return vec![(gx, gy, index as u8)];
        }
    }

    (0..layer_count)
        .map(|layer| (gx, gy, layer as u8))
        .collect()
}

fn endpoint_positions(
    sources: &[(i32, i32, u8)],
    targets: &[(i32, i32, u8)],
) -> Vec<(i32, i32)> {
    let mut positions = Vec::new();
    for &(gx, gy, _) in sources.iter().chain(targets.iter()) {
        if !positions.contains(&(gx, gy)) {
            positions.push((gx, gy));
        }
    }
    positions
}

fn grid_path_to_route(
    path: &[(i32, i32, u8)],
    grid_step: f64,
    width: f64,
    layer_names: &[String],
) -> Vec<RouteSegment> {
    let mut route = Vec::new();
    let Some(&(first_x, first_y, first_layer)) = path.first() else {
        return route;
    };

    route.push(RouteSegment::Wire {
        x: from_grid(first_x, grid_step),
        y: from_grid(first_y, grid_step),
        layer: layer_name(first_layer, layer_names),
        width,
    });

    for pair in path.windows(2) {
        let (prev_x, prev_y, prev_layer) = pair[0];
        let (x, y, layer) = pair[1];

        if layer != prev_layer {
            let via_x = from_grid(prev_x, grid_step);
            let via_y = from_grid(prev_y, grid_step);
            route.push(RouteSegment::Via {
                x: via_x,
                y: via_y,
                from_layer: layer_name(prev_layer, layer_names),
                to_layer: layer_name(layer, layer_names),
            });
            route.push(RouteSegment::Wire {
                x: via_x,
                y: via_y,
                layer: layer_name(layer, layer_names),
                width,
            });
            continue;
        }

        route.push(RouteSegment::Wire {
            x: from_grid(x, grid_step),
            y: from_grid(y, grid_step),
            layer: layer_name(layer, layer_names),
            width,
        });
    }

    compact_route(route)
}

fn compact_route(route: Vec<RouteSegment>) -> Vec<RouteSegment> {
    let mut compacted: Vec<RouteSegment> = Vec::new();

    for segment in route {
        if should_replace_last_wire(&compacted, &segment) {
            compacted.pop();
        }
        compacted.push(segment);
    }

    compacted
}

fn should_replace_last_wire(route: &[RouteSegment], next: &RouteSegment) -> bool {
    let RouteSegment::Wire {
        x: next_x,
        y: next_y,
        layer: next_layer,
        ..
    } = next
    else {
        return false;
    };
    let Some(RouteSegment::Wire {
        x: prev_x,
        y: prev_y,
        layer: prev_layer,
        ..
    }) = route.last()
    else {
        return false;
    };
    let Some(RouteSegment::Wire {
        x: before_x,
        y: before_y,
        layer: before_layer,
        ..
    }) = route.iter().rev().nth(1)
    else {
        return false;
    };

    if prev_layer != next_layer || before_layer != next_layer {
        return false;
    }

    let dx1 = sign(prev_x - before_x);
    let dy1 = sign(prev_y - before_y);
    let dx2 = sign(next_x - prev_x);
    let dy2 = sign(next_y - prev_y);
    dx1 == dx2 && dy1 == dy2
}

fn get_trace_width(input: &SimpleRouteJson, connection: &SimpleRouteConnection) -> f64 {
    connection
        .width
        .as_ref()
        .and_then(NumberOrString::as_f64)
        .or_else(|| {
            connection
                .nominal_trace_width
                .as_ref()
                .and_then(NumberOrString::as_f64)
        })
        .or_else(|| {
            input
                .nominal_trace_width
                .as_ref()
                .and_then(NumberOrString::as_f64)
        })
        .or_else(|| input.min_trace_width.as_ref().and_then(NumberOrString::as_f64))
        .unwrap_or(0.2)
}

fn get_connection_ids(connection: &SimpleRouteConnection) -> Vec<String> {
    let mut ids = vec![connection.name.clone()];
    if let Some(id) = &connection.source_trace_id {
        ids.push(id.clone());
    }
    for point in &connection.points_to_connect {
        if let Some(id) = &point.point_id {
            ids.push(id.clone());
        }
        if let Some(id) = &point.pcb_port_id {
            ids.push(id.clone());
        }
    }
    ids
}

fn get_layer_names(layer_count: usize) -> Vec<String> {
    if layer_count <= 1 {
        return vec!["top".to_string()];
    }
    if layer_count == 2 {
        return vec!["top".to_string(), "bottom".to_string()];
    }

    let mut layers = vec!["top".to_string()];
    for index in 1..(layer_count - 1) {
        layers.push(format!("inner{index}"));
    }
    layers.push("bottom".to_string());
    layers
}

fn layer_name(layer: u8, layer_names: &[String]) -> String {
    layer_names
        .get(layer as usize)
        .cloned()
        .unwrap_or_else(|| format!("inner{layer}"))
}

fn layer_to_index(layer: &str, layer_count: usize) -> Option<usize> {
    match layer {
        "top" | "F.Cu" => Some(0),
        "bottom" | "B.Cu" => Some(layer_count.saturating_sub(1)),
        _ if layer.starts_with("inner") => layer[5..].parse::<usize>().ok(),
        _ => None,
    }
    .filter(|index| *index < layer_count)
}

fn clearance_radius(width: f64, clearance: f64, grid_step: f64) -> i32 {
    ((width / 2.0 + clearance) / grid_step).ceil().max(0.0) as i32
}

fn to_grid(value: f64, grid_step: f64) -> i32 {
    (value / grid_step).round() as i32
}

fn from_grid(value: i32, grid_step: f64) -> f64 {
    let scaled = value as f64 * grid_step;
    (scaled * 1_000_000.0).round() / 1_000_000.0
}

fn sign(value: f64) -> i32 {
    if value > 0.0 {
        1
    } else if value < 0.0 {
        -1
    } else {
        0
    }
}
