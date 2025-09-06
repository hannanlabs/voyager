docker_build('otel-collector', 'infrastructure/otel-collector')
k8s_yaml('deployments/otel-collector/dev/local.yaml')
k8s_resource('otel-collector', port_forwards=['4317:4317', '4318:4318'])

docker_build('prometheus', 'infrastructure/prometheus')
k8s_yaml('deployments/prometheus/dev/local.yaml')
k8s_resource('prometheus', port_forwards='9090:9090')

docker_build('loki', 'infrastructure/loki')
k8s_yaml('deployments/loki/dev/local.yaml')
k8s_resource('loki', port_forwards='3100:3100')

docker_build('frontend', '.', dockerfile='apps/frontend/Dockerfile')
k8s_yaml('deployments/frontend/dev/local.yaml')
k8s_resource('frontend', port_forwards='3000:3000')

docker_build('simulator', '.', dockerfile='apps/simulator/Dockerfile')
k8s_yaml('deployments/simulator/dev/local.yaml')
k8s_resource('simulator', port_forwards='8080:8080')

