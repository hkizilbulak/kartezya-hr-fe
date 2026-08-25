cat << 'INNER_EOF' > app/\(dashboard\)/\(pages\)/candidates/patch.txt
                      <thead>
                        <tr>
                          <th
                            onClick={() => handleSort('name')}
                            className="sortable-header"
                            style={{ cursor: 'pointer' }}
                          >
                            Ad Soyad {getSortIcon('name')}
                          </th>
                          <th style={{ width: 150 }}>E-posta</th>
                          <th style={{ width: 130 }}>Telefon</th>
                          <th
                            onClick={() => handleSort('seniority')}
                            className="sortable-header"
                            style={{ cursor: 'pointer', width: 120 }}
                          >
                            Kıdem {getSortIcon('seniority')}
                          </th>
                          <th
                            onClick={() => handleSort('interview_count')}
                            className="sortable-header"
                            style={{ cursor: 'pointer', width: 130 }}
                          >
                            Görüşme Sayısı {getSortIcon('interview_count')}
                          </th>

                          <th
                            onClick={() => handleSort('created_at')}
                            className="sortable-header"
                            style={{ cursor: 'pointer', width: 160 }}
                          >
                            Eklenme Tarihi {getSortIcon('created_at')}
                          </th>
                          <th style={{ width: 80 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {isInitialLoading ? (
                          Array.from({ length: 8 }).map((_, idx) => (
                            <tr key={idx}>
                              <td><div className="placeholder-glow"><span className="placeholder col-8 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-10 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-8 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-4 rounded"></span></div></td>
                              <td className="text-center"><div className="placeholder-glow"><span className="placeholder col-3 rounded-pill"></span></div></td>

                              <td><div className="placeholder-glow"><span className="placeholder col-4 rounded"></span></div></td>
                              <td><div className="placeholder-glow"><span className="placeholder col-6 rounded"></span></div></td>
                            </tr>
                          ))
                        ) : candidates.length > 0 ? (
                          candidates.map((c) => (
                            <React.Fragment key={c.id}>
                              <tr key={`row-${c.id}`}>
                                <td className="fw-semibold">
                                  <div className="d-flex align-items-center">
                                    <Button
                                      variant="light"
                                      size="sm"
                                      className="p-1 me-2"
                                      onClick={(e) => toggleRow(e, c)}
                                      title="Görüşme Geçmişi"
                                      style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none' }}
                                    >
                                      {expandedRow === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </Button>
                                    <span>{c.name || '—'}</span>
                                  </div>
                                </td>
                                <td className="small text-dark">{c.email?.toLowerCase() || <span className="text-muted">—</span>}</td>
                                <td className="small text-dark">
                                  {c.phone ? formatPhone(c.phone) : <span className="text-muted">—</span>}
                                </td>
                                <td className="small">{c.seniority || '—'}</td>
                                <td className="text-center">
                                  <span className="badge bg-secondary rounded-pill">
                                    {c.interview_count ?? 0}
                                  </span>
                                </td>

                                <td className="small text-muted">
                                  {c.created_at
                                    ? new Date(c.created_at).toLocaleDateString('tr-TR')
                                    : '—'}
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-1 justify-content-end">
INNER_EOF
