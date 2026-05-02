function useBootstrap() {
  var _s = useState({data:null, loading:true, error:null});
  var state = _s[0], setState = _s[1];

  var load = useCallback(function() {
    /* only show spinner on first load */
    setState(function(prev){ return Object.assign({},prev,{loading:true}); });
    apiFetch('bootstrap')
      .then(function(d){ setState({data:d, loading:false, error:null}); try{window.__CSPSR_BS__=d;}catch(e){} })
      .catch(function(e){ setState(function(prev){ return Object.assign({},prev,{loading:false,error:e.message}); }); });
  }, []);

  var silentReload = useCallback(function() {
    apiFetch('bootstrap')
      .then(function(d){ setState(function(prev){ return Object.assign({},prev,{data:d}); }); })
      .catch(function(){});
  }, []);

  useEffect(function(){ load(); }, [load]);
  return { data:state.data, loading:state.loading, error:state.error, reload:load, silentReload:silentReload };
}
function useCRUD(resource) {
  var _s = useState([]); var items = _s[0], setItems = _s[1];
  var _l = useState(false); var loading = _l[0], setLoading = _l[1];
  var load = useCallback(function() {
    setLoading(true);
    apiFetch(resource).then(function(d){ setItems(Array.isArray(d)?d:[]); setLoading(false); })
      .catch(function(){ setLoading(false); });
  }, [resource]);
  useEffect(function(){ load(); }, [load]);
  function create(d) { return apiFetch(resource, {method:'POST',body:JSON.stringify(d)}).then(load); }
  function update(id,d) { return apiFetch(resource+'/'+id, {method:'PUT',body:JSON.stringify(d)}).then(load); }
  function remove(id) { return apiFetch(resource+'/'+id, {method:'DELETE'}).then(load); }
  return { items:items, loading:loading, create:create, update:update, remove:remove, load:load };
}

/* â•â•â• UI COMPONENTS â•â•â• */

