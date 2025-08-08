package api

import (
	"k8s.io/apimachinery/pkg/runtime/schema"
)

var (
	SchemeGroupVersion = schema.GroupVersion{Group: "voyager.dev", Version: "v1alpha1"}
)
